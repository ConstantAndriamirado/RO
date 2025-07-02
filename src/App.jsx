import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import DijkstraVisualizer from "./DijkstraVisualizer";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';


const App = () => {
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
              <div className="container">
                <Link className="navbar-brand" to="/">Dijkstra App</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav ms-auto">
                    <li className="nav-item">
                      <Link className="nav-link" to="/">Accueil</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/visualisation">Visualisation</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/visualisation" element={<DijkstraVisualizer />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
