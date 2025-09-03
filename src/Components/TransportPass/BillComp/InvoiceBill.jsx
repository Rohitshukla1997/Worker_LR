import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import "./InvoiceBill.css";
import logo from "../../../assets/brand/fmslog.png";

const InvoiceBill = ({ invoiceData }) => {
  const invoiceRef = useRef();

  // Default empty object if invoiceData is undefined or null
  const {
    companyName,
    companyAddress,
    companyEmail,
    gstIn,
    companyOfficeNumber,
    companyMobileNumber,
    lorryNumber,
    date,
    vehicleName,
    ownerName,
    consignorName,
    consignorAddress,
    consigneeName,
    consigneeAddress,
    customerName,
    customerAddress,
    startLocation,
    endLocation,
    containerNumber,
    sealNumber,
    itemName,
    itemQuantity,
    itemUnit,
    itemWeight,
    itemcost,
    customerRate,
    totalAmount,
    transporterRate,
    totalTransporterAmount,
    transporterRateOn,
    customerRateOn,
    customerFreight,
    transporterFreight,
    driverId,
    driverName,
    driverContact,
  } = invoiceData || {};

  // const driverName = driverId?.name || 'N/A'
  // const driverContact = driverId?.contactNumber || 'N/A'

  const handleDownloadPDF = () => {
    const element = invoiceRef.current.cloneNode(true);
    const footer = element.querySelector(".invoice-footer");
    if (footer) footer.remove();

    element.style.padding = "30px";
    element.style.backgroundColor = "white";
    element.style.fontFamily = "'Segoe UI', sans-serif";

    const signature = element.querySelector(".signature-section");
    if (signature) {
      signature.style.pageBreakInside = "avoid";
      signature.style.breakInside = "avoid";
      signature.style.marginTop = "30px";
    }

    const opt = {
      margin: 0,
      filename: `Invoice-${lorryNumber || "Bill"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1400,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        avoid: [".signature-section"],
        mode: ["avoid-all", "css", "legacy"],
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="invoice-wrapper">
      <div className="invoice" ref={invoiceRef}>
        {/* Header */}
        <div className="invoice-header">
          <div className="header-left">
            <div className="company-logo-name">
              <img
                src={logo}
                alt="Company Logo"
                className="company-logo"
                crossOrigin="anonymous"
              />
              <div>
                <h1>{companyName || "N/A"}</h1>
                <p>{companyAddress || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <p>
              <strong>GSTIN:</strong> {gstIn || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {companyEmail || "N/A"}
            </p>
            <p>
              <strong>Office:</strong> {companyOfficeNumber || "N/A"}
            </p>
            <p>
              <strong>Mobile:</strong> {companyMobileNumber || "N/A"}
            </p>
          </div>
        </div>

        {/* Vehicle & Route */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Vehicle Details</h3>
            <div className="details-row">
              <p>
                <strong>Lorry Number:</strong> {lorryNumber || "N/A"}
              </p>
              <p>
                <strong>Date:</strong> {date || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Vehicle:</strong> {vehicleName || "N/A"}
              </p>
              <p>
                <strong>Owner:</strong> {ownerName || "N/A"}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Route Details</h3>
            <div className="details-row">
              <p>
                <strong>Destination:</strong> {startLocation || "N/A"} →{" "}
                {endLocation || "N/A"}
              </p>
              <p>
                <strong>Container No.:</strong> {containerNumber || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Seal No.:</strong> {sealNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Consignor & Consignee */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Consignor Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {consignorName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {consignorAddress || "N/A"}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Consignee Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {consigneeName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {consigneeAddress || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="section">
          <h3>Item Details</h3>
          <table className="item-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Weight (kg)</th>
                <th>Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{itemName || "N/A"}</td>
                <td>{itemQuantity || "N/A"}</td>
                <td>{itemUnit || "N/A"}</td>
                <td>{itemWeight || "N/A"}</td>
                <td>₹{itemcost?.toLocaleString() || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer & Transporter */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Customer Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {customerName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {customerAddress || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Customer Rate On:</strong> ₹{customerRate || 0}
              </p>
              <p>
                <strong>Customer Rate:</strong> ₹{customerRate || 0}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Customer Freight:</strong> ₹
                {customerFreight?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Transporter Details</h3>
            <div className="details-row">
              <p>
                <strong>Driver:</strong> {driverName}
              </p>
              <p>
                <strong>Contact:</strong> {driverContact}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Transporter Rate On:</strong> ₹{transporterRateOn || 0}
              </p>
              <p>
                <strong>Transporter Rate:</strong> ₹{transporterRate || 0}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Transporter Freight:</strong> ₹
                {transporterFreight?.toLocaleString() || 0}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹
                {totalTransporterAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        {/* T&C and Signature */}
        <div className="invoice-page">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>
              Goods are transported at the owner's risk unless otherwise
              specified.
            </li>
            <li>
              Transporter is not liable for damages caused by natural calamities
              or accidents.
            </li>
            <li>
              Delivery will be made only upon presentation of the original lorry
              receipt.
            </li>
          </ul>
          <div className="signature-section">
            <p>
              <strong>Authorized Signatory (Transporter):</strong> ____________
            </p>
            <p>Consignor: ____________ Consignee: ____________</p>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer text-center">
          <p className="stamp">[Transport Company Stamp]</p>
          <button className="download-btn" onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBill;
