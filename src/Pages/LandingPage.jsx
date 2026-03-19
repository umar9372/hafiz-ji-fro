import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
    const navigate = useNavigate();
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success fixed-top">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#home">
            HAFIZ JI
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" onClick={()=> navigate("/inventory")}>
                  Inventory
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" onClick={() => navigate("/purchase")}>
                  Purchases
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" onClick={() => navigate("/sales")}>
                  Sales
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link" onClick={()=> navigate("/inventory")}>
                  Suppliers
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">
                  Vendors
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contact">
                  Materials
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contact">
                  Rates
                </a>
              </li>
             
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="bg-dark text-white text-center py-5"
        style={{ marginTop: "56px" }}
      >
        <div className="container py-5">
          <h1 className="display-5 fw-bold">Sell Your Scrap Easily</h1>
          <p className="lead mt-3">
            We collect paper, plastic, metal & e-waste at the best prices
          </p>
          <a href="#contact" className="btn btn-success btn-lg mt-3">
            Book Scrap Pickup
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-4">Our Services</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Paper Scrap</h5>
                  <p className="card-text">
                    Newspapers, books, cartons & office paper
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Plastic & Metal</h5>
                  <p className="card-text">
                    Bottles, containers, iron, aluminum & steel
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">E-Waste</h5>
                  <p className="card-text">
                    Old mobiles, laptops, wires & electronics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h2 className="fw-bold">About Hafiz JI</h2>
              <p className="mt-3">
                Hafiz JI is a trusted scrap collection service helping
                households and businesses recycle waste responsibly while
                earning money.
              </p>
            </div>
            <div className="col-md-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1581091215367-59ab6c7f7b59"
                alt="Scrap recycling"
                className="img-fluid rounded"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5 bg-success text-white">
        <div className="container">
          <h2 className="text-center fw-bold mb-4">Contact Us</h2>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <form>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Name"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Mobile Number"
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Scrap Details"
                  ></textarea>
                </div>
                <button className="btn btn-dark w-100">Submit Request</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3">
        <div className="container">
          <small>© 2025 Hafiz JI. All Rights Reserved.</small>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
