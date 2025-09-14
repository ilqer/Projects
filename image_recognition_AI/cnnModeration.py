# moderation_cnn.py
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input, Conv2D, MaxPooling2D, BatchNormalization, Dropout,
    Flatten, Dense, GlobalAveragePooling2D
)
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.metrics import TopKCategoricalAccuracy


class cnnModeration:
    def __init__(self, input_shape=(150,150, 3), num_classes=6):
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None

    def build_cnn_from_scratch(self):
        #Build CNN architecture optimized for moderation detection

        self.model = Sequential([
            # Input layer
            Input(shape=self.input_shape),
            # First Block
            Conv2D(16, (3, 3), activation='relu', padding='same'),
            BatchNormalization(),
            Conv2D(16, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.2),

            # Second Block
            Conv2D(64, (3, 3), activation='relu', padding='same'),
            BatchNormalization(),
            Conv2D(64, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.2),

            # Third Block
            Conv2D(32, (3, 3), activation='relu', padding='same'),
            BatchNormalization(),
            Conv2D(32, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.2),

            # Fourth Block
            # Conv2D(32, (3, 3), activation='relu', padding='same'),
            # BatchNormalization(),
            # Conv2D(32, (3, 3), activation='relu', padding='same'),
            # MaxPooling2D((2, 2)),
            # Dropout(0.2),

            GlobalAveragePooling2D(),

            #Dense layers
            # Dense(512, activation='relu'),
            # BatchNormalization(),
            # Dropout(0.3),

            Dense(256, activation='relu'),
            BatchNormalization(),
            Dropout(0.4),

            # Output
            Dense(self.num_classes, activation='softmax')
        ])

        return self.model

    def compile_model(self, learning_rate=0.001):
        if self.model is None:
            raise ValueError("Model not built yet. Call build_cnn_from_scratch() first.")

        self.model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy', TopKCategoricalAccuracy(k=3)]
        )

        print(" Model compiled successfully")
        return self.model

    def get_model_summary(self):
        if self.model is None:
            raise ValueError("Model not built yet.")
        self.model.summary()
        total_params = self.model.count_params()
        print(f"\n Total parameters: {total_params:,}")
        print(f"\n Trainable parameters: {total_params:,}")

    def save_model_architecture(self, filepath="model_architecture.json"):
        if self.model is None:
            raise ValueError("Model not built yet.")

        model_json = self.model.to_json()
        with open(filepath, "w") as json_file:
            json_file.write(model_json)
        print(f" Model architecture saved to {filepath}")


# Usage example
# cnn = cnnModeration(input_shape=(224, 224, 3), num_classes=5)
# model = cnn.build_cnn_from_scratch()
# model = cnn.compile_model(learning_rate=0.001)
# cnn.get_model_summary()