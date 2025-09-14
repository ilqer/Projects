
import time
from botocore.exceptions import ClientError
import logging
from RekognitionModerationLabel import RekognitionModerationLabel

logger = logging.getLogger(__name__)
class RekognitionImage:
    """
    Encapsulates an Amazon Rekognition image. This class is a thin wrapper
    around parts of the Boto3 Amazon Rekognition API.
    """

    def __init__(self, image, image_name, rekognition_client):
        """
        Initializes the image object.

        :param image: Data that defines the image, either the image bytes or
                      an Amazon S3 bucket and object key.
        :param image_name: The name of the image.
        :param rekognition_client: A Boto3 Rekognition client.
        """
        self.image = image
        self.image_name = image_name
        self.rekognition_client = rekognition_client


    def detect_moderation_labels(self):
        """
        Detects moderation labels in the image. Moderation labels identify content
        that may be inappropriate for some audiences.

        :logger.info: The list of moderation labels found in the image with logger.info.
        """
        try:
            response = self.rekognition_client.detect_moderation_labels(
                Image=self.image
            )
            labels = [
                RekognitionModerationLabel(label)
                for label in response["ModerationLabels"]
            ]
            if labels:
                for  label in labels:
                    logger.info(f" {label.name}")
                    logger.info(f"   Confidence: {label.confidence:.2f}%")
                    logger.info(f"   Parent Category: {label.parent_name or 'None'}")
            else:
                logger.info("No moderation labels detected.")
            logger.info(
                "Found %s moderation labels in %s.", len(labels), self.image_name
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'ProvisionedThroughputExceededException':
                time.sleep(2)
                try:
                    response = self.rekognition_client.detect_moderation_labels(
                        Image=self.image
                    )
                    labels = [
                        RekognitionModerationLabel(label)
                        for label in response["ModerationLabels"]
                    ]
                    if labels:
                        for label in labels:
                            logger.info(f" {label.name}")
                            logger.info(f"   Confidence: {label.confidence:.2f}%")
                            logger.info(f"   Parent Category: {label.parent_name or 'None'}")
                    else:
                        logger.info("No moderation labels detected.")
                    logger.info(
                        "Found %s moderation labels in %s.", len(labels), self.image_name
                    )
                    return labels
                except ClientError:
                    logger.warning("Couldn't fix the error!!!")
                    return []
            else:
                logger.exception(
                    "Couldn't detect moderation labels in %s.", self.image_name)
                raise
        else:
            return labels


