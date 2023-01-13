# CBSA-Wisers Analytics Challenge @HKUST 2022/23

This repo showcases the coding scripts that is used to generate analytical results that support the presentation made by the [TBD] team for [CBSA-WISERS ANALYTICS CHALLENGE](https://analyticschallenge.hkust.edu.hk/).

Note: Some of the `data` folders such as `xlsx` and `jsons` are omitted in accordance with the [dataset agreement](https://cbsa.hkust.edu.hk/CBSA-Wisers-Analytics-Challenge-2022-23-Dataset-Agreement) 

## Scripts Structure

All scripts are located under the `scripts` folder. They are placed under the following 3 categories:

1. `setup` => for extracting and turning raw data into useful tables or storage
2. `datasetB` => scripts pertaining to the tags and sentiment analysis of datasetB as provided by Wisers
3. `annualReports` => scripts pertaining to the tags and sentiment analysis of 2013 - 2022 corporate annual reports in HK

For `datasetB`, the workflow goes from transforming `.xlsx` to `.jsonl` formats and for `annualReports`, the `.pdf` files are transformed to `.txt` formats. Each line of the `jsonl` and `txt` file would then be parsed to conduct hashtags and sentiment analysis respectively.

## Get started

Steps to follow prior to running the `scripts`:

1. Install `Node.js (LTS or 16+)` and `Python3`.

If your computer does not have them, please visit https://nodejs.org/en/ or https://www.python.org/downloads/ to download it.

2. Install Dependencies and Setup Environment
```sh
$ npm install
$ `python3 -m pipenv` or `pipenv install`
```

Rename the `.env.example` to `.env` and replace your own keys within the file.

3. Run Scripts

e.g.
```sh
$ python3 ./scripts/setup/read_pdf.py
$ npm run tagsAndSentiment
```

You should see the results generated in the `results` folder. Enjoy :)
