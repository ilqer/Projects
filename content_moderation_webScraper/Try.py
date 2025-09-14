#comments are for singular image detection
#import boto3
#from rekognitionImage import RekognitionImage
from rekognitionBucketImage import detect_moderation_labels_bucket


def main():
    #comments are for singular image detection
    # photo = 'beachPeople.jpeg'
    # bucketIn = 'imagebuckettestforkobil1'
    # imageKey = 'beachPeople.jpeg'
    # imageTo = RekognitionImage(
    #     image={'S3Object': {'Bucket': bucketIn, 'Name': imageKey}},
    #     image_name=photo,
    #     rekognition_client=boto3.client('rekognition', region_name='us-east-1')
    # )
    # labels = imageTo.detect_moderation_labels()
    # print(f"Detected {len(labels)} moderation labels in {photo}.")

    bucket = 'imagebuckettestforkobil1'
    detect_moderation_labels_bucket(bucket,50)




if __name__ == "__main__":
    main()
