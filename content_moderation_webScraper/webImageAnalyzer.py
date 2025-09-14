import hashlib
import requests
import boto3
from botocore.exceptions import ClientError
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from rekognitionImage import RekognitionImage
from PIL import Image
import io
import time
import datetime

logger = logging.getLogger(__name__)


class WebImageAnalyzer:
    #max_workers: max images processes at the same time
    #max_depth: max depth of urls to go from main website
    #analyzed_hashes: images set that has been analyzed

    def __init__(self, max_workers=10, max_depth=3):
        self.rekognition_client = boto3.client('rekognition', region_name='eu-central-1')
        self.analyzed_hashes = set()
        self.visited_urls = set()
        self.max_workers = max_workers
        self.max_depth = max_depth
        self.session = requests.Session()

        #for if the website blocks access frequently
        #from requests_html import HTMLSession
        #self.session = HTMLSession()
        self.max_image_size = 5 * 1024 * 1024 #5mb
        self.progress = {'processed': 0,'total':0}
        self.flagged = []
        self.displayed_flagged_count = 0
    def get_image_hash(self, image_data):
        return hashlib.sha256(image_data).hexdigest()

    #convert unusable formats to jpeg
    def convert_to_jpeg(self, image_data):
        try:
            with Image.open(io.BytesIO(image_data)) as image:
                if image.format in ['JPEG', 'PNG'] and len(image_data) <= self.max_image_size:
                    return image_data

                # Convert to RGB if it is necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')

                # Resize if too large
                if max(image.size) > 4096:
                    image.thumbnail((4096, 4096), Image.Resampling.LANCZOS)

                # Convert to JPEG
                output = io.BytesIO() #keeps without saving to disk
                image.save(output, format='JPEG', quality=85, optimize=True)
                return output.getvalue()
        except :
            logger.warning(f"Couldn't fix the image for processing!")
            return None

    def is_valid_image(self, image_data):
        try:
            if len(image_data) < 1000:  # Skip tiny images
                return False
            with Image.open(io.BytesIO(image_data)) as image:
                return min(image.size) > 50  # Skip small icons
        except:
            return False

    def extract_images_from_page(self, url):
        try:
            #5 sec timeout--wait until it becomes unnecessary to do so
            response = self.session.get(url, timeout=5)
            #If cannot reach image, raise exception before attempting entry
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            images = []
            for image in soup.find_all('img'):
                source = image.get('src')
                if source:
                    full_url = urljoin(url, source)
                    images.append(full_url)

            return images
        except:
            return []

    def download_and_analyze_image(self, image_url):
        try:

            response = self.session.get(image_url, timeout=5)
            response.raise_for_status()

            if not self.is_valid_image(response.content):
                return None

            # Convert to JPEG if needed
            converted_data = self.convert_to_jpeg(response.content)
            if not converted_data:
                return None

            image_hash = self.get_image_hash(converted_data)
            if image_hash in self.analyzed_hashes:
                return None

            self.analyzed_hashes.add(image_hash)
            labels = []
            try:
                image_data = {'Bytes': converted_data}
                rekognition_image = RekognitionImage(image_data, image_url, self.rekognition_client)
                labels = rekognition_image.detect_moderation_labels()
            except ClientError as e:
                if e.response['Error']['Code'] == 'ProvisionedThroughputExceededException':
                    time.sleep(2)
                    try:
                        rekognition_image = RekognitionImage(image_data, image_url, self.rekognition_client)
                        labels = rekognition_image.detect_moderation_labels()
                        return {
                            'url': image_url,
                            'hash': image_hash,
                            'labels': [label.to_dict() for label in labels],  # Convert to dict
                            'size': len(converted_data)
                        }
                    except ClientError:
                        logger.warning("Couldn't fix the error!!!")
                else:
                    raise
            return {
                'url': image_url,
                'hash': image_hash,
                'labels': [label.to_dict() for label in labels],  # Convert to dict
                'size': len(converted_data)
            }
        except:
            return None

    def get_all_links(self,start_url):
        all_urls = {start_url}
        current_level = [start_url]  # Queue of URLs to process

        while current_level:
            next_level = []
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all URLs at current level for processing
                futures = []
                for url in current_level[:50]:
                    futures.append(executor.submit(self.extract_links_from_page, url))


                for future in as_completed(futures):
                    for link in future.result():
                        if link not in all_urls and len(all_urls)<1000:
                            all_urls.add(link)
                            next_level.append(link)
            current_level = next_level
        return list(all_urls)

    # def get_all_links(self, start_url):
    #     all_urls = {start_url}
    #     current_level = [start_url]  # Queue of URLs to process
    #     current_depth = 0
    #
    #     while current_level and current_depth < self.max_depth:
    #         next_level = []
    #         with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
    #             # Submit all URLs at current level for processing
    #             futures = []
    #             for url in current_level[:50]:
    #                 futures.append(executor.submit(self.extract_links_from_page, url))
    #
    #             # Clear processed URLs from queue
    #
    #             for future in as_completed(futures):
    #                 for link in future.result():
    #                     # no more than 500 links to process
    #                     if link not in all_urls:
    #                         all_urls.add(link)
    #                         next_level.append(link)
    #         current_level = next_level
    #         current_depth+=1
    #     return list(all_urls)

    def extract_links_from_page(self, url):
        if url in self.visited_urls:
            return []
        self.visited_urls.add(url)
        try:
            response = self.session.get(url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')

            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)
                # Only follow links from the same domain to stay inside the website
                if urlparse(full_url).netloc == urlparse(url).netloc:
                    links.append(full_url)

            #limit if there are more than 20 links
            return links[:20]
        except:
            return []

    def analyze_website(self, start_url):
        logger.info(f"Starting analysis of {start_url}")

        all_urls = self.get_all_links(start_url)
        logger.info(f"Found {len(all_urls)} URLs to process")

        all_images = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = []
            for url in all_urls:
                futures.append(executor.submit(self.extract_images_from_page, url))

            for future in as_completed(futures):
                images = future.result()
                all_images.extend(images)

        unique_images = set(all_images)
        self.progress = {'processed': 0, 'total': len(unique_images)}
        logger.info(f"Found {len(unique_images)} unique image URLs")

        results = []
        processed = 0
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = []
            for img in unique_images:
                futures.append(executor.submit(self.download_and_analyze_image, img))
            for future in as_completed(futures):
                result = future.result()
                if result:
                    results.append(result)
                    if result['labels']:
                        self.flagged.append(result)
                processed+=1
                self.progress['processed'] = processed

        logger.info(f"Analyzed {len(results)} new images")
        return {'results': results, 'flagged': self.flagged}



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    analyzer = WebImageAnalyzer(max_workers=10, max_depth=3)
    output = analyzer.analyze_website("https://www.haberler.com/")


    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"flagged_images_{timestamp}.txt"
    with open(filename, 'w') as f:
        for item in analyzer.flagged:
            f.write(f"URL: {item['url']}\n")
            f.write(f"Labels: {[label.name for label in item['labels']]}\n")
            f.write(f"Size: {item['size']} bytes\n")
            f.write("-" * 50 + "\n")

    print(f"Total images analyzed: {len(output['results'])}")
    print(f"Flagged images: {len(analyzer.flagged)}")
