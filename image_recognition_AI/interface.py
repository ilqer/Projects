from dataset import datasetDownloader
from data_pipeline import moderationDataPipeline
from train_pipeline import moderationTraining
from cnnModeration import cnnModeration
import tensorflow as tf

def main():
    tf.config.threading.set_inter_op_parallelism_threads(4)
    tf.config.threading.set_intra_op_parallelism_threads(4)
    downloader = datasetDownloader("pathset")
    downloader.setup_directory_structure()
    downloader.download_data()
    downloader.split_data()

    pipeline = moderationDataPipeline("pathset")

    train_gen, val_gen, test_gen = pipeline.data_augmentation()

    cnn = cnnModeration(input_shape=(150, 150, 3), num_classes=6)
    model = cnn.build_cnn_from_scratch()
    model = cnn.compile_model(learning_rate=0.001)
    cnn.get_model_summary()

    trainer = moderationTraining(model, train_gen, val_gen, test_gen)
    history = trainer.train_model(epochs=50)
    trainer.evaluate_model()
    final_model_path = trainer.save_final_model()

    print(f" Final model saved: {final_model_path}")
    print(history.history)

if __name__ == "__main__" :
    main()