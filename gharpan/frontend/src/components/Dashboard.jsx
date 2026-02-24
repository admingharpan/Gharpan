import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Card, Row, Col } from "react-bootstrap";
import logo from "../images/image1.jpg";
import { Link } from "react-router-dom";

const dashboardFont = {
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
};

const Dashboard = () => {
  const quickModules = [
    {
      title: "Resident Registration",
      iconClass: "fa fa-user-plus",
      link: "/register",
    },
    { title: "Listing", iconClass: "fa fa-list", link: "/listings" },
    {
      title: "Care Tracking Timeline",
      iconClass: "fa fa-heartbeat",
      link: "/care-tracking",
    },
  ];

  return (
    <>
      <div style={{ background: "#FEFCF2" }}>
        <div className="container" style={{ marginTop: "80px", paddingTop: "1rem", ...dashboardFont }}>
          <div
            className="p-3 text-center rounded-3 shadow dashboard-header"
            style={{
              ...dashboardFont,
              letterSpacing: "0.5px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <h1
                style={{
                  fontWeight: 700,
                  fontSize: "1.8rem",
                  marginBottom: 0,
                  marginTop: 0,
                  lineHeight: 1,
                }}
              >
                Gharpan Foundation
              </h1>
              <p
                className="lead"
                style={{ fontSize: "0.9rem", fontWeight: 400, marginTop: 0, marginBottom: 0 }}
              >
                Overview of all rehabilitation activities and records.
              </p>
              <img
                src={logo}
                alt="logo"
                className="dashboard-logo"
                style={{
                  borderRadius: "1rem",
                  width: 120,
                  height: 120,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 mb-3">
          <div className="p-3 text-center bg-body-tertiary">
            <div className="container">
              <h4 className="text-center mb-2" style={{ color: "#0A400C", fontSize: "1.1rem" }}>
                Management Modules
              </h4>
              <Row>
                {quickModules.map((item, index) => (
                  <Col key={index} md={4} className="mb-2">
                    {item.link ? (
                      <Link to={item.link} style={{ textDecoration: "none" }}>
                        <Card
                          className="shadow-lg text-center card-bor quick-card dashboard-hover"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            borderRadius: "1rem",
                            border: "2px solid #e5e7eb",
                            minHeight: 120,
                            fontFamily: "inherit",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            cursor: "pointer",
                            marginBottom: "1rem",
                          }}
                        >
                          <Card.Body style={{ padding: "0.8rem 0.8rem" }}>
                            <i
                              className={`${item.iconClass} fa-2x mb-3`}
                              style={{ color: "#0A400C" }}
                            ></i>
                            <Card.Title
                              className="dashboard-title"
                              style={{
                                fontWeight: 700,
                                fontSize: "1rem",
                                marginBottom: 8,
                                letterSpacing: "0.5px",
                              }}
                            >
                              {item.title}
                            </Card.Title>
                          </Card.Body>
                        </Card>
                      </Link>
                    ) : (
                      <Card
                        className="shadow-lg text-center card-bor quick-card dashboard-hover"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          borderRadius: "1rem",
                          border: "2px solid #e5e7eb",
                          minHeight: 120,
                          fontFamily: "inherit",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          cursor: "pointer",
                          marginBottom: "1rem",
                        }}
                      >
                        <Card.Body style={{ padding: "1.5rem 1rem" }}>
                          <i
                            className={`${item.iconClass} fa-2x mb-3`}
                            style={{ color: "#0A400C" }}
                          ></i>
                          <Card.Title
                            className="dashboard-title"
                            style={{
                              fontWeight: 700,
                              fontSize: "1rem",
                              marginBottom: 8,
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.title}
                          </Card.Title>
                        </Card.Body>
                      </Card>
                    )}
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

