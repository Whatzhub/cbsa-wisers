# coding=utf8
import os
import pandas as pd

# config
appDir = os.path.abspath(os.getcwd())
dataFile = 'AC2022_set1'

print(f'Loading excel file: {dataFile}...')
df = pd.read_excel(f'{appDir}/data/xlsx/{dataFile}.xlsx', na_filter=False)
df['content'] = df['content'].apply(str)
df['comment_count'] = df['comment_count'].replace('', '0').astype(int)
df['like_count'] = df['like_count'].replace('', '0').astype(int)
df['dislike_count'] = df['dislike_count'].replace('', '0').astype(int)
df['view_count'] = df['view_count'].replace('', '0').astype(int)

print(f'Top 5 rows {df.head(5)}')
print(f'Bottom 5 rows {df.tail(5)}')

try:
    with open(f'{appDir}/data/jsons/{dataFile}.json', 'w+') as json_file:
        json_file.write(df.to_json(
            f'{appDir}/data/jsons/{dataFile}.jsonl', orient='records', force_ascii=False, lines=True))
except Exception as ex:
    print(ex)

print(f'Complete write to jsonl.')
