# pip install gradio jinja2
import gradio as gr
from jinja2 import Template
import json, tempfile, os

REPORT_TEMPLATE = """<!doctype html>
<html>
  <head><meta charset="utf-8"><title>{{ title }}</title></head>
  <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto;">
    <h1>{{ title }}</h1>
    <p><b>Author:</b> {{ author }} &nbsp; | &nbsp; <b>Date:</b> {{ date }}</p>
    <hr>
    <div>{{ body | safe }}</div>
    {% if department %}<p><b>Department:</b> {{ department }}</p>{% endif %}
  </body>
</html>"""

def render_preview(title, author, date, body, extra_json):
    ctx = {"title": title, "author": author, "date": date, "body": body}
    if extra_json:
        try:
            ctx.update(json.loads(extra_json))
        except Exception as e:
            return f"<pre style='color:red'>JSON error: {e}</pre>"
    return Template(REPORT_TEMPLATE).render(**ctx)

def export_html(title, author, date, body, extra_json):
    html = render_preview(title, author, date, body, extra_json)
    fd, path = tempfile.mkstemp(suffix=".html")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(html)
    return path  # DownloadButton expects a filepath
          
with gr.Blocks(title="Report Builder") as demo:
    with gr.Row():
        # Left: form
        with gr.Column(scale=1, min_width=320):
            title  = gr.Textbox(label="Title", placeholder="Quarterly Report")
            author = gr.Textbox(label="Author", placeholder="Jane Doe")
            date   = gr.Textbox(label="Date", placeholder="2025-09-11")
            body   = gr.Textbox(label="Body (HTML allowed)", lines=8, placeholder="<p>Hello world</p>")
            extra  = gr.Textbox(label="Extra JSON (optional)", lines=6,
                                placeholder='{"department": "Sales"}')
            export_btn = gr.Button("Export HTML")
            download   = gr.DownloadButton("Download report")
        # Right: live HTML preview
        with gr.Column(scale=2):
            preview = gr.HTML(label="Live preview")

    # Live updates: run render_preview whenever any input changes
    for inp in (title, author, date, body, extra):
        inp.change(render_preview, inputs=[title, author, date, body, extra], outputs=preview)

    # Export: write file and wire it to the DownloadButton
    export_btn.click(export_html, inputs=[title, author, date, body, extra], outputs=download)

demo.launch()
