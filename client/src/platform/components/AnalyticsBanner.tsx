/*
  This file implements Google Analytics tracking and a consent banner.
*/
import React from "react";
import ReactGA from "react-ga";
import "./analytics_banner.css";

const COOKIE_NAME = "acceptAnalytics";
const COOKIE_ACCEPTED = "accepted";
const COOKIE_DECLINED = "declined";

function writeCookie(accepted: boolean) {
  const val = accepted ? COOKIE_ACCEPTED : COOKIE_DECLINED;
  // Set the max age for a year.
  document.cookie = COOKIE_NAME + "=" + val + ";max-age=31536000";
}

function hasResponseCookie() {
  const cookies = document.cookie
    .split(";")
    .filter((item) => item.trim().startsWith(COOKIE_NAME));
  if (cookies.length === 0) {
    return null;
  }
  return cookies[0].split("=")[1];
}

function initialize(path?: string) {
  if (process.env.NODE_ENV === "production") {
    ReactGA.initialize("UA-42261140-5");
    if (path !== undefined) {
      ReactGA.pageview(path);
    }
  } else {
    initializeFake();
  }
}

function initializeFake() {
  ReactGA.initialize("foo", { testMode: true });
}

// Initialize Google analytics before components get rendered
// if we already have an accept cookie.
if (hasResponseCookie() === COOKIE_ACCEPTED) {
  initialize();
} else {
  initializeFake();
}

interface AnalyticsState {
  responded: boolean;
}

export default class AnalyticsBanner extends React.Component<
  {},
  AnalyticsState
> {
  constructor(props: {}) {
    super(props);

    this.state = {
      responded: hasResponseCookie() !== null,
    };
  }

  onAccept = () => {
    writeCookie(true);
    initialize(window.location.pathname);
    this.setState({ responded: true });
  };

  onDecline = () => {
    writeCookie(false);
    this.setState({ responded: true });
  };

  render() {
    const { responded } = this.state;
    if (responded) {
      return <div />;
    }
    return (
      <div className="analyticsBannerMsg">
        <div>
          Thanks for visiting my board games site! :) I'd like to know how many
          users use my site. If you accept, your usage will be sent to Google
          Analytics with a client ID. I'll store your preference using a browser
          cookie. - Dickson
        </div>
        <button className="analyticsBannerAccept" onClick={this.onAccept}>
          Accept
        </button>
        <button className="analyticsBannerDecline" onClick={this.onDecline}>
          Decline
        </button>
      </div>
    );
  }
}
