import PyPDF2
import json

def read_pdf(file_path):
    print(f"Reading {file_path}...")
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        return str(e)

aws_guide = read_pdf("pastit_aws_guide.pdf")
build_guide = read_pdf("pastit_build_guide.pdf")

with open("pastit_pdf_content.txt", "w", encoding="utf-8") as f:
    f.write("=== AWS GUIDE ===\n")
    f.write(aws_guide)
    f.write("\n\n=== BUILD GUIDE ===\n")
    f.write(build_guide)

print("Finished evaluating pdfs.")
