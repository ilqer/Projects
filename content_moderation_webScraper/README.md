This project contains implementation for label recognition. The active project is used for detection
of images in a bucket for content moderation. Bucket moderation also has functionality to detect all labels
in commented lines.


This project uses s3 buckets with amazon rekognition software. Both are part of aws service. Bucket used for
this project is located at eu-central-1. This can be changed for different projects regarding to different needs
of the project.


Try is the location main function is called and where parameters are passed
rekognitionImage.py is the primitive version which is used to take images 1 by 1 from bucket to analyze

In order to detect moderate text in image rekognition+comprehend may work as current version
doesn't have that functionality

Amazon uses taxonomic order to keep the moderation labels.
In practice new labels can be added to moderate or detect different objects. Amazon aws also has this service
provided in the following link: https://us-east-1.console.aws.amazon.com/rekognition/custom-labels?region=us-east-1#

This site for getting more info on labels:https://docs.aws.amazon.com/rekognition/latest/dg/labels-detect-labels-image.html

Amazon File for Moderation Labels
https://docs.aws.amazon.com/rekognition/latest/dg/samples/rekognition-moderation-labels.zip

important site: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/rekognition/client/detect_moderation_labels.html#

