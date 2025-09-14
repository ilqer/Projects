import tensorflow as tf
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
import datetime
import cv2
import numpy as np
import os
class moderationTraining:
    def __init__(self, model, train_generator, val_generator, test_generator):
        self.model = model
        self.train_generator = train_generator
        self.val_generator = val_generator
        self.test_generator = test_generator
        self.history = None

    def set_callbacks(self, model_name = "moderation_cnn_model"):
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        callbacks = [
            # Save best model
            ModelCheckpoint(
                filepath=f'{model_name}_best_{timestamp}.keras',
                monitor='val_accuracy',
                save_best_only=True,
                save_weights_only=False,
                mode='max',
                verbose=1
            ),

            # Early stopping to prevent overfitting
            EarlyStopping(
                monitor='val_accuracy',
                patience=10,
                restore_best_weights=True,
                mode='max',
                verbose=1
            ),

            # Reduce learning rate when stuck
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=4,
                min_lr=1e-7,
                verbose=1
            ),

            # Log training metrics
            CSVLogger(
                f'training_log_{timestamp}.csv',
                append=True
            )
        ]

        return callbacks

    def train_model(self, epochs = 50):
        # Debug: Check if generators have data
        print(f"Train samples: {self.train_generator.samples}")
        print(f"Validation samples: {self.val_generator.samples}")
        print(f"Test samples: {self.test_generator.samples}")
        
        if self.train_generator.samples == 0:
            raise ValueError("No training data found. Check your dataset directory structure.")
        if self.val_generator.samples == 0:
            raise ValueError("No validation data found. Check your dataset directory structure.")

        callbacks = self.set_callbacks()

        steps_per_epoch = max(1, self.train_generator.samples // self.train_generator.batch_size)
        validation_steps = max(1, self.val_generator.samples // self.val_generator.batch_size)

        self.history = self.model.fit(
            self.train_generator,
            epochs=epochs,
            steps_per_epoch=steps_per_epoch,
            validation_data=self.val_generator,
            validation_steps=validation_steps,
            callbacks=callbacks,
            verbose=1
        )

        return self.history


    def evaluate_model(self):
        test_loss, test_accuracy, test_top3_accuracy = self.model.evaluate(self.test_generator, verbose=1)
        print("Test loss:", test_loss)
        print("Test accuracy:", test_accuracy)
        print("Test top 3 accuracy:", test_top3_accuracy)

    def save_final_model(self, model_name="final_moderation_cnn"):
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        final_model_path = f"{model_name}_{timestamp}.keras"

        self.model.save(final_model_path)
        print(f" Final model saved as: {final_model_path}")

        return final_model_path

    @staticmethod
    def predict_image(image_dir, image_extensions, model, class_names):
        image_files = [os.path.join(image_dir, f) for f in os.listdir(image_dir)
                       if os.path.isfile(os.path.join(image_dir, f)) and
                       any(f.lower().endswith(ext) for ext in image_extensions)]

        for image_path in image_files:
            print(f"Processing: {image_path}")
            test_image = cv2.imread(image_path)
            if test_image is None:
                print("Error: Could not read image")
                return
            test_image = cv2.resize(test_image, (150, 150))
            test_image = test_image / 255.0
            test_image = np.expand_dims(test_image, axis=0)
            result = model.predict(test_image)
            predicted_class = class_names[np.argmax(result)]
            confidence = np.max(result) * 100
            print(f"{predicted_class} ({confidence:.1f}%)")


