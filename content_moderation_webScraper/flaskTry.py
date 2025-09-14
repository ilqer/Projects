import socketio
from flask import Flask,  jsonify, request, render_template
from flask_socketio import SocketIO, emit
import logging
from rekognitionBucketImage import detect_moderation_labels_bucket, detect_moderation_labels_post
from webImageAnalyzer import WebImageAnalyzer

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'  # Removes timestamp and logger name
)
app = Flask(__name__, template_folder='templates')
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/logged_home')
def logged_home():
    return render_template('logged_home.html')


@app.route('/analyze-bucket/<bucket_name>', methods=['GET'])
def analyze_bucket_images(bucket_name):
    try:
        message = detect_moderation_labels_bucket(bucket_name,50)
        return render_template('bucket_results.html', bucket=bucket_name, results=message)
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/analyze-image', methods=['POST'])
def analyze_from_pc():

    try:
        image = request.files['image']
        image_bytes = image.read()
        image_name = image.filename
        message = detect_moderation_labels_post(image_name, image_bytes, 50)
        return jsonify({
            'status': 'Analysis complete',
            'results': message
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze-website', methods=['GET', 'POST'])
def analyze_website():
    if request.method == 'GET':
        return render_template('website_analyzer.html')

    try:
        url = request.form['url']

        analyzer = WebImageAnalyzer()
        app.current_analyzer = analyzer
        output = analyzer.analyze_website(url)

        return jsonify({
            'results': len(output['results']),
            'flagged': len(output['flagged']),
            'flagged_details': output['flagged']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-bucket')
def analyze_bucket():
    return render_template('bucket_analyzer.html')
@app.route('/progress')
def get_progress():
    if hasattr(app, 'current_analyzer'):
        progress = app.current_analyzer.progress.copy()
        # Convert flagged items to JSON-serializable format
        flagged_json_format = []
        for item in app.current_analyzer.flagged:
            flagged_json_format.append({
                'url': item['url'],
                'labels': [{'Name': label['name'], 'Confidence': label.get('confidence', 0)} for label in
                           item['labels']]
            })
        progress['flagged'] = flagged_json_format
        return jsonify(progress)
    return jsonify({'processed': 0, 'total': 0, 'flagged': []})


@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
