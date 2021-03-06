'use strict';

const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
const defaultData = require('./data.js');
const IntermediateData = require('./data2.js');
require('dotenv').config();
const cors = require('cors');
app.use(cors());

// tells the application to use body-parser as middleware so it can handle post requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileupload());
app.use(express.static('public'));

const apiVersion = '2021-06-16';

let latestTag;
const postURL = `https://us-south.ml.cloud.ibm.com/ml/v4/deployment_jobs?version=${apiVersion}`;

// create a Watson Machine Learning job to solve a decision optimization problem using input files
app.post('/send', async function (req, res) {
  // parse the inputted files from the UI
  let json = req.files[0].data.toString();
  let plantFile = req.files[1].data.toString();

  // take away special characters to make files easier to parse
  json = json.replace(/(?:\r|\r|)/g, '');
  plantFile = plantFile.replace(/(?:\r|\r|)/g, '');

  // split files on new line
  const lines = json.split('\n');
  const lines2 = plantFile.split('\n');

  const result = [];
  const result2 = [];

  // set the first split as the headers
  const headersDemand = lines[0].split(',');
  const headersPlants = lines2[0].split(',');

  // split csv file by comma, then push into array.
  for (let i = 1; i < lines.length - 1; i++) {
    result.push(lines[i].split(','));
  }
  for (let i = 1; i < lines2.length - 1; i++) {
    result2.push(lines2[i].split(','));
  }

  // set customerDemand object
  const plantsObj = {
    id: req.files[1].name,
    fields: headersPlants,
    values: result2,
  };

  // set plants object
  const customerDemandsObj = {
    id: req.files[0].name,
    fields: headersDemand,
    values: result,
  };

  // add tag before we create a new job to solve a Decision optimization problem
  latestTag = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);
  defaultData.requestBody.tags = [latestTag];

  // set the parsed data from the input files as part of our request body
  /* eslint-disable-next-line camelcase */
  defaultData.requestBody.decision_optimization.input_data = [customerDemandsObj, plantsObj];

  console.log('SEND UPLOADED DATA');

  const response = await axios.post(postURL, defaultData.requestBody, {
    headers: {
      Authorization: process.env.TOKEN,
      'Content-Type': 'application/json',
    },
  });
  res.send(JSON.stringify(response.data));
});

// create a Watson Machine Learning job to solve a decision optimization problem using default data from the ./data.js file
app.post('/sendDefault', async function (req, res) {
  // add tag before we create a new job to solve a Decision optimization problem
  latestTag = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);
  defaultData.data.tags = [latestTag];

  console.log('SEND DEFAULT DATA');

  const response = await axios.post(postURL, defaultData.data, {
    headers: {
      Authorization: process.env.TOKEN,
      'Content-Type': 'application/json',
    },
  });
  res.send(JSON.stringify(response.data));
});
app.post('/sendIntermediate', async function (req, res) {
  // add tag before we create a new job to solve a Decision optimization problem
  latestTag = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);
    IntermediateData.data.tags = [latestTag];

  console.log('SEND INTERMEDIATE DATA');

  const response = await axios.post(postURL, IntermediateData.data, {
    headers: {
      Authorization: process.env.TOKEN,
      'Content-Type': 'application/json',
    },
  });
  res.send(JSON.stringify(response.data));
});

// get Watson Machine Learning solution by querying for our job, with the tag we created earlier
app.get('/decisionSolution', async function (req, res) {
  const getURL =
    'https://us-south.ml.cloud.ibm.com/ml/v4/deployment_jobs?space_id=' +
    process.env.SPACE_ID +
    '&tag.value=' +
    latestTag +
    '&state=completed&deployment_id=' +
    process.env.DEPLOYMENT_ID +
    '&version=' +
    apiVersion;

  const response = await axios.get(getURL, {
    headers: {
      Authorization: process.env.TOKEN,
      'Content-Type': 'application/json',
    },
  });
  console.log(JSON.stringify(response.data));
  res.send(JSON.stringify(response.data));
});

app.listen(process.env.PORT, process.env.HOST);
console.log(`Running on http://${process.env.HOST}:${process.env.PORT}`);
