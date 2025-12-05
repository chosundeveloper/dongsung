const https = require('https');
const { URL } = require('url');

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID;
const GITLAB_API_URL = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';

/**
 * GitLab 이슈 생성
 * @param {Object} issueData - { title, description, labels, severity }
 * @returns {Promise<Object>} - { id, iid, web_url }
 */
function createGitLabIssue(issueData) {
  return new Promise((resolve, reject) => {
    if (!GITLAB_TOKEN || !GITLAB_PROJECT_ID) {
      reject(new Error('GitLab configuration missing (GITLAB_TOKEN or GITLAB_PROJECT_ID)'));
      return;
    }

    const { title, description, labels = [], severity = 'medium' } = issueData;

    // 심각도에 따른 라벨 추가
    const severityLabel = `severity::${severity}`;
    const allLabels = ['bug', severityLabel, ...labels].filter(Boolean).join(',');

    const postData = JSON.stringify({
      title,
      description,
      labels: allLabels
    });

    const url = new URL(`${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/issues`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve({
              id: result.id,
              iid: result.iid,
              web_url: result.web_url
            });
          } catch (e) {
            reject(new Error(`Failed to parse GitLab response: ${e.message}`));
          }
        } else {
          reject(new Error(`GitLab API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`GitLab request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * GitLab 이슈 닫기
 * @param {number} issueIid - GitLab issue IID
 */
function closeGitLabIssue(issueIid) {
  return new Promise((resolve, reject) => {
    if (!GITLAB_TOKEN || !GITLAB_PROJECT_ID) {
      reject(new Error('GitLab configuration missing'));
      return;
    }

    const postData = JSON.stringify({ state_event: 'close' });

    const url = new URL(`${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/issues/${issueIid}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to close issue: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

module.exports = {
  createGitLabIssue,
  closeGitLabIssue
};
