// Constants and default structures shared between main and renderer.

const DEFAULTS = {
  site: {
    title: '',
    description: '',
    lang: 'en',
    owner: { name: '', bio: '', avatar: null },
    social: { instagram: null, facebook: null, email: null },
    seo: { googleAnalyticsId: null, faviconUrl: null },
    customDomain: null,
    theme: { name: 'default', options: {} },
  },

  album: {
    slug: '',
    title: 'New Album',
    description: null,
    date: '',
    coverPhoto: null,
    order: 0,
    tags: [],
    photos: [],
  },

  photo: {
    filename: '',
    altText: null,
    caption: null,
    width: 0,
    height: 0,
    order: 0,
    url: null,
  },
}

const GITHUB_CLIENT_ID = 'Ov23li6zZGk2CE3qoFQs'

const PORTFOLIO_SPEC_VERSION = '1.4'

module.exports = { DEFAULTS, GITHUB_CLIENT_ID, PORTFOLIO_SPEC_VERSION }
