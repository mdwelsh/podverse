'use client';

import { useEffect } from 'react';
import ReactGA from 'react-ga';

export function GoogleAnalytics() {

  useEffect(() => {
    ReactGA.initialize('G-F7EJYK1JLV');
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  return null;
};
