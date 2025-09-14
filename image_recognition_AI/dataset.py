# dataset_downloader.py
import requests
import zipfile
from pathlib import Path
import shutil
import kagglehub

class datasetDownloader:
    #create the labels with folder nsfwDataset
    def __init__(self, base_dir="pathset"):
        self.base_dir = Path(base_dir)
        self.classes = ['mountain', 'street', 'glacier', 'buildings', 'sea', 'forest']

    #Create organized directory structure like /test/violence /test/alcohol /train/violence
    def setup_directory_structure(self):
        for split in ['train', 'validation', 'test']:
            for class_name in self.classes:
                dir_path = self.base_dir / split / class_name
                dir_path.mkdir(parents=True, exist_ok=True)
        print("Directory structure created")

    def download_data(self, dataset_ids = None):
        if (dataset_ids) is None:
            dataset_ids = ["puneet6060/intel-image-classification"]

        for id in dataset_ids:
            try:
                print(f"Downloading {id}")
                download_path = kagglehub.dataset_download(id)
                print(f"Downloaded to {download_path}")

                source_path = Path(download_path) / "seg_train" / "seg_train"
                if not source_path.exists():
                    source_path = Path(download_path) / "seg_train"
                    if not source_path.exists():
                        print(f"seg_train folder not found in {download_path}")
                        continue

                # Copy all class folders to train directory
                train_path = self.base_dir / "train"
                for class_folder in source_path.iterdir():
                    if class_folder.is_dir() and class_folder.name in self.classes:
                        dest_folder = train_path / class_folder.name
                        if dest_folder.exists():
                            shutil.rmtree(dest_folder)
                        shutil.copytree(class_folder, dest_folder)
                        print(f"Copied {class_folder.name} to train directory")

                print(f"{id} download and copy complete")

            except Exception as e:
                print(f"Failed to download and copy {id}: {e}")
                return False
        return True

    #For balanced dataset
    #Can be ignored
    def get_target_count(self, class_name):
        targets = {
            # Violence & weapons
            'violence': 1500, 'weapons': 1000, 'guns': 800, 'blood_gore': 500,
            # Substances
            'drugs': 1000, 'alcohol': 800, 'smoking': 600,
            # Hate & extremism
            'hate_symbols': 500, 'extremism': 300, 'discrimination': 400,
            # Self-harm
            'self_harm': 300, 'suicide': 200, 'disturbing': 500,
            # Illegal
            'illegal_activities': 400, 'gambling': 300
        }
        return targets.get(class_name, 1000)

    #Split collected data into train/val/test
    def split_data(self, train_ratio=0.7, val_ratio=0.15):

        import random

        for class_name in self.classes:
            train_dir = self.base_dir / 'train' / class_name
            val_dir = self.base_dir / 'validation' / class_name
            test_dir = self.base_dir / 'test' / class_name

            # Get all image files
            image_files = [f for f in train_dir.glob('*')
                           if f.suffix.lower() in ['.jpg', '.jpeg', '.png'] and f.is_file()]

            if len(image_files) == 0:
                print(f"No images found in {train_dir}")
                continue

            # Shuffle and split
            random.shuffle(image_files)
            total = len(image_files)
            print(total , "total images")
            train_end = int(total * train_ratio)
            val_end = int(total * (train_ratio + val_ratio))

            # Move files to appropriate directories
            for i, img_file in enumerate(image_files):
                if i < train_end:
                    continue  # Keep in train
                elif i < val_end:
                    shutil.move(str(img_file), str(val_dir / img_file.name))
                else:
                    shutil.move(str(img_file), str(test_dir / img_file.name))

            print(f"  {class_name}: {train_end} train, {val_end - train_end} val, {total - val_end} test")


# Usage--------------------------------
#downloader = datasetDownloader()
#downloader.setup_directory_structure()
#downloader.download_data()
#downloader.split_data()