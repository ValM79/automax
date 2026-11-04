import React from 'react';
import ServiceDirectory from '../components/automarket/ServiceDirectory';

// "HGV Repair & Servicing" and "Auto Repair & Servicing": App.jsx passes the category name.
export default function RepairServices({ category }) {
  return <ServiceDirectory category={category} />;
}
