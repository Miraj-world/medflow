from flask import Flask, render_template, send_from_directory
import os

# Resolve frontend paths relative to this file, not the current working directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_ROOT = os.path.join(BASE_DIR, 'frontend')
FRONTEND_PAGES = os.path.join(FRONTEND_ROOT, 'pages')

app = Flask(__name__,
            static_folder=FRONTEND_ROOT,
            template_folder=FRONTEND_PAGES)

@app.route('/')
def index():
    # Serve the static HTML index directly from the pages folder
    return send_from_directory(FRONTEND_PAGES, 'index.html')


@app.route('/<path:page>')
def serve_page(page):
    """Serve HTML pages from frontend/pages directory."""
    if not page.endswith('.html'):
        page = f"{page}.html"
    candidate = os.path.join(FRONTEND_PAGES, page)
    if os.path.exists(candidate):
        return send_from_directory(FRONTEND_PAGES, page)
    return send_from_directory(FRONTEND_PAGES, 'index.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from frontend/assets"""
    return send_from_directory(FRONTEND_ROOT, os.path.join('assets', filename))

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from frontend/css"""
    return send_from_directory(FRONTEND_ROOT, os.path.join('css', filename))

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JS files from frontend/js"""
    return send_from_directory(FRONTEND_ROOT, os.path.join('js', filename))


# --- stub API routes for authentication ---------------------------------
from flask import request, jsonify

@app.route('/api/auth/<role>/login', methods=['POST'])
def api_login(role):
    data = request.get_json() or {}
    # simple validation check
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'missing fields'}), 400
    # pretend success if role is admin or clinician
    return jsonify({'message': f'logged in as {role}'}), 200

@app.route('/api/auth/<role>/signup', methods=['POST'])
def api_signup(role):
    data = request.get_json() or {}
    required = ['email', 'password']
    if role == 'admin':
        required.append('organization')
    else:
        required.append('license')
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': 'missing ' + ','.join(missing)}), 400
    return jsonify({'message': f'signed up as {role}'}), 201

# ------------------------------------------------------------------------

@app.route('/ping')
def ping():
    return 'ok'

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
