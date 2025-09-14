

from pathlib import Path
from keras.src.legacy.preprocessing.image import ImageDataGenerator

class moderationDataPipeline:
    def __init__(self, data_path, batch_size= 32, image_size= (150,150)):
        self.data_path = Path(data_path)
        self.batch_size = batch_size
        self.image_size = image_size
        self.classes = ['mountain', 'street', 'glacier', 'buildings', 'sea', 'forest']

    def data_augmentation(self):
        train_data = ImageDataGenerator(
            rescale=1. / 255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest',
            brightness_range=[0.8, 1.2],
            channel_shift_range=20.0
        )
        val_test_data = ImageDataGenerator(rescale=1. / 255)

        train_generator = train_data.flow_from_directory(
            self.data_path / 'train',
            target_size= self.image_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            classes = self.classes,
            shuffle=True,
            seed=43
        )
        validation_generator = val_test_data.flow_from_directory(
            self.data_path / 'validation',
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            classes= self.classes,
            shuffle=False
        )

        test_generator = val_test_data.flow_from_directory(
            self.data_path / 'test',
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            classes=self.classes,
            shuffle=False
        )

        return train_generator, validation_generator, test_generator
