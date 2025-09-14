import pytest
from unittest.mock import patch
from flaskTry import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()


@patch('flaskTry.detect_moderation_labels_bucket')
def test_analyze_bucket_success(mock_detect, client):
    mock_detect.return_value = ['No moderation labels detected']

    response = client.get('/analyze-bucket/test-bucket')

    assert response.status_code == 200
    assert response.json['bucket'] == 'test-bucket'
    assert response.json['status'] == 'Analysis complete'


@patch('flaskTry.detect_moderation_labels_post')
def test_analyze_image_success(mock_detect, client):
    mock_detect.return_value = ['No moderation labels detected']

    data = {'image': (open(__file__, 'rb'), 'test.jpg')}
    response = client.post('/analyze-image', data=data)

    assert response.status_code == 200
    assert response.json['status'] == 'Analysis complete'


def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
