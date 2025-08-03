import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          &copy; {new Date().getFullYear()} FileToffee - Instant and Collaborative File Sharing
        </p>
      </div>
    </footer>
  );
};

export default Footer; 