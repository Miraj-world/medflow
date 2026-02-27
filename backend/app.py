from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, 
            static_folder=os.path.abspath('../frontend'),
            template_folder=os.path.abspath('../frontend/pages'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:page>')
def serve_page(page):
    """Serve HTML pages from frontend/pages directory"""
    if not page.endswith('.html'):
        page += '.html'
    try:
        return render_template(page)
    except:
        return render_template('index.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from frontend/assets"""
    return send_from_directory(os.path.abspath('../frontend/assets'), filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from frontend/css"""
    return send_from_directory(os.path.abspath('../frontend/css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JS files from frontend/js"""
    return send_from_directory(os.path.abspath('../frontend/js'), filename)

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
