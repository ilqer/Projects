import tensorflow as tf
import cv2
import numpy as np
import os
from train_pipeline import moderationTraining
def main():
    # Predict
    model = tf.keras.models.load_model('final_moderation_cnn_20250730_145644.keras')
    class_names = ['mountain', 'street', 'glacier', 'buildings', 'sea', 'forest']
    image_dir = '/Users/ilkeryigitel/Downloads/MLImages/'
    image_extensions = ['.jpg', '.jpeg', '.png']
    moderationTraining.predict_image(image_dir,image_extensions,model,class_names)



if __name__ == "__main__":
    main()