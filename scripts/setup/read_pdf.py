# coding=utf8
import os
from pdfminer.high_level import extract_text

# iterate over pdfs
top3_dir_path = './data/pdfs/top3'
bottom3_dir_path = './data/pdfs/bottom3'

def convert_pdf_to_txt(dirPath):
    for foldername in os.scandir(dirPath):
        if foldername.is_dir():
            for filename in os.scandir(foldername.path):
                if filename.is_file():
                    with open(filename.path, 'rb') as pdf_file:
                        print(f'reading {filename.path} file now')
                        arr = filename.path.split('.')[1].split('/')
                        print(arr)
                        # ignore hidden files
                        if not arr[5] == '':
                            write_file_name = f'{arr[3]}/{arr[4]}/{arr[5]}'
                            write_file_path = f'./results/txts/{write_file_name}.txt'
                            text = extract_text(pdf_file)
                            # create dir if not exists
                            is_exist = os.path.exists(
                                f'./results/txts/{arr[3]}/{arr[4]}')
                            if not is_exist:
                                os.makedirs(
                                    f'./results/txts/{arr[3]}/{arr[4]}')
                            with open(write_file_path, 'w+') as txt_file:
                                print('writing txt file now')
                                txt_file.write(text)

# run pdf to txt converters
convert_pdf_to_txt(top3_dir_path)
convert_pdf_to_txt(bottom3_dir_path)