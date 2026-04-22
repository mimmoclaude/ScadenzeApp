// Mock Google OAuth service for local development
// This allows the app to work completely locally without needing real Google credentials
// In production, replace with real Google OAuth configuration

export const initMockGoogle = () => {
  if (!window.google) {
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config) => {
            return {
              requestAccessToken: (opts = {}) => {
                // Simulate OAuth flow
                const mockToken = generateMockToken();

                setTimeout(() => {
                  if (opts.onSuccess) {
                    opts.onSuccess({
                      access_token: mockToken,
                      token_type: 'Bearer',
                      expires_in: 3599,
                      scope: 'openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send',
                      authuser: 0,
                    });
                  }
                }, 500);
              },
            };
          },
          initCodeClient: (config) => {
            return {
              requestCode: () => {
                console.log('Mock: Code requested');
              },
            };
          },
        },
      },
    };
  }

  // Mock gapi for Google APIs
  if (!window.gapi) {
    window.gapi = {
      load: (api, callback) => {
        setTimeout(callback, 100);
      },
      auth2: {
        getAuthInstance: () => ({
          currentUser: {
            get: () => ({
              getBasicProfile: () => ({
                getEmail: () => 'test@gmail.com',
                getName: () => 'Test User',
                getId: () => '123456789',
              }),
            }),
          },
        }),
      },
      client: {
        init: (config) => new Promise((resolve) => setTimeout(resolve, 100)),
        calendar: {
          events: {
            insert: (params) => mockCalendarInsert(params),
          },
        },
      },
    };
  }
};

function generateMockToken() {
  // Generate a mock JWT-like token
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: 'https://accounts.google.com',
    azp: '123456789-abc.apps.googleusercontent.com',
    aud: '123456789-abc.apps.googleusercontent.com',
    sub: '123456789',
    email: 'test@gmail.com',
    email_verified: true,
    at_hash: 'abc123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
}

function mockCalendarInsert(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock: Calendar event inserted', params);
      resolve({
        result: {
          id: 'mock_event_' + Date.now(),
          summary: params.resource.summary,
          start: params.resource.start,
          end: params.resource.end,
          htmlLink: 'https://calendar.google.com/mock',
        },
      });
    }, 300);
  });
}

// Mock sendEmail for Gmail
export const mockSendEmail = async (to, subject, body) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock: Email sent', { to, subject, body });
      resolve({
        id: 'mock_email_' + Date.now(),
        threadId: 'mock_thread',
        message: 'Email sent successfully',
      });
    }, 200);
  });
};

// Initialize mock Google when this module loads
initMockGoogle();
