import React from "react";
import "./Footer.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function Footer() {
  return (
    <footer
      className="footer text-white py-2"
      style={{ background: "#0A400C" }}
    >
      <div className="container">
        <div className="row text-center text-md-start">
          {/* Contact Section */}
          <div className="col-md-6">
            <h5 className="footer-title">Contact Us</h5>
            <p className="footer-text mb-0 small">
              <i className="fa fa-map-marker me-2"></i>
              S.No 122/1, Pride World City, Charholi Budruk, Pimpri-Chinchwad, Pune 412105
            </p>
            <p className="footer-text mb-0 small">
              <i className="fa fa-phone me-2"></i>
              +91 7720046640
            </p>
            <p className="footer-text small">
              <i className="fa fa-envelope me-2"></i>
              connect@gharpanfoundation.org
            </p>
          </div>

          {/* About Section */}
          <div className="col-md-6">
            <h5 className="footer-title">About Gharpan</h5>
            <p className="footer-text small mb-0">
              Gharpan Foundation is committed to holistic rehabilitation and care for individuals in need.
            </p>
          </div>
        </div>

        <hr className="bg-light my-1" />

        <p className="text-center mb-0 py-1 small">
          © 2025 Gharpan Foundation. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;

