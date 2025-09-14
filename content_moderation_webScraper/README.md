The active project is used for detection of images in a website for content moderation of its subdomains. 

This project also contains implementations of label recognition, s3 buckets with amazon rekognition software and flask image upload. Both are part of aws service.

There are 2 main function based on required usage which are named Try and flaskTry


In order to detect moderate text in image rekognition+comprehend may work as current version
doesn't have that functionality


In practice new labels can be added to moderate or detect different objects. Amazon aws also has this service
provided in the following link: https://us-east-1.console.aws.amazon.com/rekognition/custom-labels?region=us-east-1#

This site for getting more info on labels:https://docs.aws.amazon.com/rekognition/latest/dg/labels-detect-labels-image.html

Amazon File for Moderation Labels
https://docs.aws.amazon.com/rekognition/latest/dg/samples/rekognition-moderation-labels.zip

important site: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/rekognition/client/detect_moderation_labels.html#

