/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Adapted by @olivomarco to connect to Microsoft Teams.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const assert = require('assert');
const convertToTeamsMessage = require('../server.js').convertToTeamsMessage;

describe('convertToTeamsMessage', () => {
  const textMessage = [{
    platform: 'PLATFORM_UNSPECIFIED',
    text: {
      text: ['test text']
    },
    message: 'text',
  }];
  const textTeamsMessage = [{
    type: 'message',
    text: 'test text',
  }];

  it('should convert simple text message', async () => {
    assert.deepEqual(await convertToTeamsMessage(null, textMessage),
        textTeamsMessage);
  });

  const complexMessage = [{
    platform: 'VIBER',
    card: {
      buttons: [{
        text: 'Button to Respond',
        postback: 'image',
      }, {
        text: 'Button to URL',
        postback: 'https://viber-test.com',
      }],
      title: 'Title',
      subtitle: 'subtitle',
      imageUri: 'https://www.image.org/image.png',
    },
    message: 'card'
  }, {
    platform: 'VIBER',
    text: {
      text: ['test text viber']
    },
    message: 'text'
  }, {
    platform: 'TEAMS',
    card: {
      buttons: [{
        text: 'button to text',
        postback: 'you pressed the button',
      }, {
        text: 'button to url',
        postback: 'https://teams.microsoft.com',
      }],
      title: 'Card',
      subtitle: 'this is the subtitle',
      imageUri: 'https://www.image.org/image.png',
    },
    message: 'card'
  }, {
    platform: 'TEAMS',
    text: {
      text: ['test text teams']
    },
    message: 'text'
  }, {
    platform: 'PLATFORM_UNSPECIFIED',
    message: 'text',
  }];

  const complexTeamsMessage = [{
    type: 'message',
    attachments: [{
      content: {
        buttons: [{
          title: "button to text",
          type: "postBack",
          value: "you pressed the button",
        }, {
          title: "button to url",
          type: "openUrl",
          value: "https://teams.microsoft.com",
        }],
        images: [{
          url: "https://www.image.org/image.png"
        }],
        text: "this is the subtitle",
        title: "Card",
      },
      contentType: "application/vnd.microsoft.card.hero"
    }]
  }, {
    type: 'message',
    text: 'test text teams',
  }];

  it('should convert complex message', async () => {
    assert.deepEqual(await convertToTeamsMessage(null, complexMessage),
        complexTeamsMessage);
  });
});
