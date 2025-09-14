import boto3
from botocore.exceptions import ClientError
import logging
from RekognitionModerationLabel import RekognitionModerationLabel
#import next line for All Label Rekognition
from RekognitionLabel import RekognitionLabel

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'  # Removes timestamp and logger name
)
def detect_moderation_labels_bucket(bucket,confidence):
    """
    Detects moderation labels in the image. Moderation labels identify content
    that may be inappropriate for some audiences.

    :return: The list of moderation labels found in the image.
    """
    toReturn = []
    element = ''
    rekognition = boto3.client('rekognition', region_name='us-east-1')
    server = boto3.client('s3', region_name='us-east-1')
    try:

        bucket_images = server.list_objects_v2(Bucket=bucket)
        image_keys = [obj['Key'] for obj in bucket_images['Contents']]

        for image_key in image_keys:
            if not image_key.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
            try:
                response = rekognition.detect_moderation_labels(
                    Image={'S3Object': {'Bucket': bucket, 'Name': image_key}},
                    MinConfidence=confidence #change for confidence level
                )
                # All labels detection--not just moderation
                # response2 = rekognition.detect_labels(
                #     Image={'S3Object': {'Bucket': bucket, 'Name': image_key}}
                # )
                # labels = [
                #     RekognitionLabel(label)
                #     for label in response2["Labels"]
                # ]
                labels = [
                    RekognitionModerationLabel(label)
                    for label in response["ModerationLabels"]
                ]
                if labels:
                    logger.info(f"Detected {len(labels)} moderation labels in {image_key}.")
                    element += f"Detected {len(labels)} moderation labels in {image_key}.<br><br>"
                    for label in labels:
                        logger.info(f" {label.name}")
                        logger.info(f"   Confidence: {label.confidence:.2f}%")
                        logger.info(f"   Parent Category: {label.parent_name or 'None'}")
                        element += f" {label.name}<br>   Confidence: {label.confidence:.2f}%<br>   Parent Category: {label.parent_name or 'None'}<br>"
                else:
                    logger.info(f"No moderation labels detected in: {image_key}")
                    element += f"No moderation labels detected in: {image_key}<br>"

                logger.info(
                    "Found %s moderation labels in %s.", len(labels), image_key
                )
            except ClientError:
                logger.exception(
                    "Couldn't detect moderation labels in %s.", image_key
                )
            toReturn.append(element)
            element = ''
    except ClientError as e:
        logger.exception(
            "Couldn't detect servers %s.",e)
    return toReturn


#change image to base64 and send that when get is requested
def detect_moderation_labels_post(image_name,image_bytes,confidence):
    """
    Detects moderation labels in the image. Moderation labels identify content
    that may be inappropriate for some audiences.

    :return: The list of moderation labels found in the image.
    """
    toReturn = []
    rekognition = boto3.client('rekognition', region_name='us-east-1')
    try:

        if not image_name.lower().endswith(('.png', '.jpg', '.jpeg')):
            return 'No image found'
        try:
            response = rekognition.detect_moderation_labels(
                Image={'Bytes': image_bytes},
                MinConfidence=confidence #change for confidence level
            )
            labels = [
                RekognitionModerationLabel(label)
                for label in response["ModerationLabels"]
            ]
            if labels:
                logger.info(f"Detected {len(labels)} moderation labels in {image_name}.")
                toReturn.append(f"Detected {len(labels)} moderation labels in {image_name}.")
                toReturn.append('')
                for label in labels:
                    logger.info(f" {label.name}")
                    logger.info(f"   Confidence: {label.confidence:.2f}%")
                    logger.info(f"   Parent Category: {label.parent_name or 'None'}")
                    logger.info("\n")
                    toReturn.append(f" {label.name}")
                    toReturn.append(f"   Confidence: {label.confidence:.2f}%")
                    toReturn.append(f"   Parent Category: {label.parent_name or 'None'}")
            else:
                logger.info(f"No moderation labels detected in: {image_name}")
                toReturn.append(f"No moderation labels detected in:{image_name}")
            logger.info(
                "Found %s moderation labels in %s.", len(labels), image_name
            )
        except ClientError:
            logger.exception(
                "Couldn't detect moderation labels in %s.", image_name
            )
    except ClientError as e:
        logger.exception(
            "Couldn't detect servers %s.", e)
    return toReturn





