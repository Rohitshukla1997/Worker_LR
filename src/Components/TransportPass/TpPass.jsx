import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "../ReusableComponents/Table";
import SmartPagination from "../ReusableComponents/SmartPagination";
import {
  fetchTpPassData,
  postLorryReciptApi,
  patchLorryReciptApi,
  deleteLorryReciptApi,
  VehicleApi,
  DriverApi,
  getCompanyNameApi,
} from "./data/data";
import AddButton from "../ReusableComponents/AddButton";
import SearchInput from "../ReusableComponents/SearchInput";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import LorryForm from "../ReusableComponents/LorryFrom";
import DateRangeFilterCredence from "../ReusableComponents/DateRangeFilterCredence";
import InvoiceBill from "./BillComp/InvoiceBill";
import IconDropdown from "../ReusableComponents/IconDropdown";
import usePdfExporter from "../../customhooks/usePdfExporter";
import useExcelExporter from "../../customhooks/useExcelExporter";
import { FaArrowUp, FaPrint, FaRegFilePdf } from "react-icons/fa";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import { HiOutlineLogout } from "react-icons/hi";

const TpPass = () => {
  const queryClient = useQueryClient();
  const { exportToPDF } = usePdfExporter();
  const { exportToExcel } = useExcelExporter();

  // fetch tp pass
  const {
    data: tpPass = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["tpPass"],
    queryFn: fetchTpPassData,
  });

  // inside vehicle
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: VehicleApi,
  });

  // fetch driver
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: DriverApi,
  });

  // Company
  const { data: companys = [] } = useQuery({
    queryKey: ["companys"],
    queryFn: getCompanyNameApi,
  });

  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // form state
  const [showModalFrom, setShowModalFrom] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  //  Add mutation
  const addTpPassMutation = useMutation({
    mutationFn: postLorryReciptApi,
    onSuccess: () => {
      queryClient.invalidateQueries(["tpPass"], { refetchActive: true });
      toast.success("TP Pass created successfully");
      setShowModalFrom(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create TP Pass");
    },
  });

  //  Update mutation
  const updateTpPassMutation = useMutation({
    mutationFn: ({ id, data }) => patchLorryReciptApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tpPass"], { refetchActive: true });
      toast.success("TP Pass updated successfully");
      setShowModalFrom(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update TP Pass");
    },
  });

  //  Delete mutation
  const deleteTpPassMutation = useMutation({
    mutationFn: deleteLorryReciptApi,
    onSuccess: () => {
      queryClient.invalidateQueries(["tpPass"], { refetchActive: true });
      Swal.fire("Deleted!", "TP Pass has been deleted.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Failed to delete TP Pass",
        "error"
      );
    },
  });

  // Update filteredData when data changes
  useEffect(() => {
    if (!Array.isArray(tpPass)) return;

    let filtered = [...tpPass];

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item.companyName || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(item.driverName || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(item.lorryNumber || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(item.customerName || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          String(item.vehicleName || "")
            .toLowerCase()
            .includes(lowerQuery)
      );
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
      const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.originalDate).getTime();
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1); // reset to first page when filter changes
  }, [tpPass, searchQuery, dateRange]);

  //  handle add/edit form submission

  const handleFormSubmit = (formData) => {
    let vehicleName = "";
    let driverName = "";

    // Vehicle
    if (typeof formData.vehicleId === "object") {
      const selectedVehicle = vehicles.find(
        (v) => v.id === formData.vehicleId.value
      );
      vehicleName = selectedVehicle?.name || formData.vehicleId.label;
    } else {
      // manually typed
      const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
      vehicleName = selectedVehicle?.name || formData.vehicleId || "";
    }

    // Driver
    if (typeof formData.driverId === "object") {
      const selectedDriver = drivers.find(
        (d) => d.id === formData.driverId.value
      );
      driverName = selectedDriver?.name || formData.driverId.label;
    } else {
      // manually typed
      const selectedDriver = drivers.find((d) => d.id === formData.driverId);
      driverName = selectedDriver?.name || formData.driverId || "";
    }

    // Company
    let companyName = "";
    if (typeof formData.companyId === "object") {
      const selectedCompany = companys.find(
        (c) => c.id === formData.companyId.value
      );
      companyName = selectedCompany?.name || formData.companyId.label;
    } else {
      const selectedCompany = companys.find((c) => c.id === formData.companyId);
      companyName = selectedCompany?.name || formData.companyId || "";
    }

    const payload = {
      ...formData,
      vehicleId: formData.vehicleId?.value || formData.vehicleId || "",
      driverId: formData.driverId?.value || formData.driverId || "",
      companyId: formData.companyId?.value || formData.companyId || "",
      vehicleName,
      driverName,
      companyName,
    };

    console.log("Payload to send:", payload);

    if (editMode && editingUser) {
      updateTpPassMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      addTpPassMutation.mutate(payload);
    }
  };

  //  handle delete with confirmation
  const handleDeleteButton = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteTpPassMutation.mutate(id);
      }
    });
  };

  // handle edit button
  const handleEditButton = (id) => {
    const recordToEdit = filteredData.find(
      (item) => String(item.id || item._id) === String(id)
    );

    if (recordToEdit) {
      // Format date to YYYY-MM-DD for date input
      const formattedDate = recordToEdit.date
        ? new Date(recordToEdit.date).toISOString().split("T")[0]
        : "";

      // Prepare vehicle select
      const selectedVehicle = vehicles.find(
        (v) => v.id === recordToEdit.vehicleId
      );

      // Prepare driver select
      const selectedDriver = drivers.find(
        (d) => d.id === recordToEdit.driverId
      );

      setEditingUser({
        ...recordToEdit,
        date: formattedDate,
        vehicleId: selectedVehicle
          ? { value: selectedVehicle.id, label: selectedVehicle.name }
          : null,
        driverId: selectedDriver
          ? { value: selectedDriver.id, label: selectedDriver.name }
          : null,
      });

      setEditMode(true);
      setShowModalFrom(true);
    }
  };

  // table columns
  const columns = [
    { label: "Date", key: "date", sortable: true },
    { label: "Supervisor", key: "supervisorName", sortable: true },
    { label: "Employee", key: "workerName", sortable: true },
    { label: "Company Name", key: "companyName", sortable: true },
    { label: "Company Address", key: "companyAddress", sortable: true },
    { label: "Company Email", key: "companyEmail", sortable: true },
    { label: "GSTIN", key: "gstIn", sortable: true },
    { label: "Office Number", key: "companyOfficeNumber", sortable: true },
    { label: "Mobile Number", key: "companyMobileNumber", sortable: true },
    { label: "Lorry Receipt No.", key: "lorryNumber", sortable: true },
    { label: "Driver Name", key: "driverName", sortable: true },
    { label: "Vehicle Name", key: "vehicleName", sortable: true },
    { label: "Owner Name", key: "ownerName", sortable: true },
    { label: "Consignor Name", key: "consignorName", sortable: true },
    { label: "Consignor Address", key: "consignorAddress", sortable: true },
    { label: "Consignee Name", key: "consigneeName", sortable: true },
    { label: "Consignee Address", key: "consigneeAddress", sortable: true },
    { label: "Customer Name", key: "customerName", sortable: true },
    { label: "Customer Address", key: "customerAddress", sortable: true },
    { label: "Start Location", key: "startLocation", sortable: true },
    { label: "End Location", key: "endLocation", sortable: true },
    // { label: "Driver Contact", key: "driverContact", sortable: true },
    { label: "Container Number", key: "containerNumber", sortable: true },
    { label: "Seal Number", key: "sealNumber", sortable: true },
    { label: "Item Name", key: "itemName", sortable: true },
    { label: "Item Quantity", key: "itemQuantity", sortable: true },
    { label: "Item Unit", key: "itemUnit", sortable: true },
    { label: "Item Weight", key: "itemWeight", sortable: true },
    { label: "Item Charged", key: "itemcost", sortable: true },
    { label: "Customer Rate", key: "customerRate", sortable: true },
    { label: "Total Amount", key: "totalAmount", sortable: true },
    { label: "Transporter Rate", key: "transporterRate", sortable: true },
    {
      label: "Total Transporter Amount",
      key: "totalTransporterAmount",
      sortable: true,
    },
    { label: "Transporter Rate On", key: "transporterRate", sortable: true },
    { label: "Customer Rate On", key: "customerRate", sortable: true },
    { label: "Customer Freight", key: "customerFreight", sortable: true },
    { label: "Transporter Freight", key: "transporterFreight", sortable: true },
  ];

  // field data
  const fields = [
    {
      name: "date",
      label: "Date",
      type: "date",
      placeholder: "Select date",
      section: "Tp Pass",
      required: true,
    },

    // Company Details
    {
      name: "companyId",
      label: "Company Name",
      type: "select",
      placeholder: "Select company",
      section: "Company Details",
      required: true,
      options: companys.map((c) => ({
        value: c.id || c._id,
        label: c.name || c.companyName,
      })),
    },

    // Consignor Details
    {
      name: "consignorName",
      label: "Consignor Name",
      type: "text",
      placeholder: "Enter consignor name",
      section: "Consignor Details",
    },
    {
      name: "consignorAddress",
      label: "Consignor Address",
      type: "text",
      placeholder: "Enter consignor address",
      section: "Consignor Details",
    },

    // Consignee Details
    {
      name: "consigneeName",
      label: "Consignee Name",
      type: "text",
      placeholder: "Enter consignee name",
      section: "Consignee Details",
    },
    {
      name: "consigneeAddress",
      label: "Consignee Address",
      type: "text",
      placeholder: "Enter consignee address",
      section: "Consignee Details",
    },

    // Basic details
    {
      name: "lorryNumber",
      label: "Lorry Number",
      type: "text",
      placeholder: "Enter lorry number",
      section: "Basic Details",
    },

    {
      name: "vehicleId",
      label: "Vehicle Name",
      type: "select",
      placeholder: "Select or enter vehicle",
      section: "Basic Details",
      required: true,
      creatable: true,
      options: vehicles.map((v) => ({
        value: v.id,
        label: v.name,
      })),
    },

    {
      name: "driverId",
      label: "Driver Name",
      type: "select",
      placeholder: "Select or enter driver",
      section: "Basic Details",
      required: true,
      creatable: true,
      options: drivers.map((d) => ({
        value: d.id,
        label: d.name,
      })),
    },

    {
      name: "ownerName",
      label: "Owner Name",
      type: "text",
      placeholder: "Enter owner name",
      section: "Basic Details",
    },

    // Customer Details
    {
      name: "customerName",
      label: "Customer Name",
      type: "text",
      placeholder: "Enter customer name",
      section: "Customer Details",
    },
    {
      name: "customerAddress",
      label: "Customer Address",
      type: "text",
      placeholder: "Enter customer address",
      section: "Customer Details",
    },

    // Routes Details

    {
      name: "startLocation",
      label: "Start Location",
      type: "text",
      placeholder: "Enter start location",
      section: "Routes Details",
    },

    {
      name: "endLocation",
      label: "End Location",
      type: "text",
      placeholder: "Enter end location",
      section: "Routes Details",
    },

    // Cargo Details

    {
      name: "itemName",
      label: "Item Name",
      type: "text",
      placeholder: "Enter item name",
      section: "Cargo Details",
    },
    {
      name: "itemQuantity",
      label: "Item Quantity",
      type: "number",
      placeholder: "Enter quantity",
      section: "Cargo Details",
    },
    {
      name: "itemUnit",
      label: "Item Unit",
      type: "number",
      placeholder: "Enter unit",
      section: "Cargo Details",
    },
    {
      name: "itemWeight",
      label: "Item Weight",
      type: "number",
      placeholder: "Enter weight",
      section: "Cargo Details",
    },
    {
      name: "itemcost",
      label: "Item Cost",
      type: "number",
      placeholder: "Enter cost",
      section: "Cargo Details",
    },

    {
      name: "sealNumber",
      label: "Seal Number",
      type: "number",
      placeholder: "Enter seal number",
      section: "Cargo Details",
    },

    {
      name: "containerNumber",
      label: "Container Number",
      type: "number",
      placeholder: "Enter container number",
      section: "Cargo Details",
    },

    //Freight Details and sub details

    {
      name: "customerRate",
      label: "Customer Rate",
      type: "number",
      placeholder: "Enter customer rate",
      section: "Freight Details",
    },
    {
      name: "customerRateOn",
      label: "Customer Rate",
      type: "number",
      placeholder: "Enter customer rate",
      section: "Freight Details",
    },

    {
      name: "customerFreight",
      label: "Customer Freight",
      type: "number",
      placeholder: "Enter customer freight",
      section: "Freight Details",
    },

    {
      name: "totalTransporterAmount",
      label: "Total Transporter Amount",
      type: "number",
      placeholder: "Enter transporter total",
      section: "Freight Details",
    },
    {
      name: "transporterFreight",
      label: "Transporter Freight",
      type: "number",
      placeholder: "Enter transporter freight",
      section: "Freight Details",
    },
    {
      name: "transporterRate",
      label: "Transporter Rate",
      type: "number",
      placeholder: "Enter transporter rate",
      section: "Freight Details",
    },
    {
      name: "transporterRateOn",
      label: "Transporter Rate",
      type: "number",
      placeholder: "Enter transporter rate",
      section: "Freight Details",
    },

    {
      name: "totalAmount",
      label: "Total Amount",
      type: "number",
      placeholder: "Enter total amount",
      section: "Freight Details",
    },
  ];

  // Handle Search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Handle Date Range Change
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // handle view bill button
  const handleViewButton = (id) => {
    const selectedData = filteredData.find(
      (item) => String(item.id || item._id) === String(id)
    );
    if (selectedData) {
      setSelectedInvoiceData(selectedData);
      setShowInvoiceModal(true);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    // Clear sessionStorage and localStorage
    sessionStorage.clear();
    localStorage.clear();

    // Optional: Clear cookies (will only clear cookies accessible via JavaScript)
    document.cookie.split(";").forEach((c) => {
      const base = c.trim().split("=")[0];
      document.cookie = `${base}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Redirect to Credence
    window.history.replaceState(null, "", "/");
    // window.location.href = 'http://localhost:3000'
    window.location.href = import.meta.env.VITE_API_CREDENCE_URL;
  };

  // Memoized dropdown items for export
  const dropdownItems = useMemo(
    () => [
      // {
      //   icon: FaRegFilePdf,
      //   label: "Download PDF",
      //   onClick: () =>
      //     exportToPDF({
      //       title: "All Worker List Report",
      //       columns,
      //       data: filteredData,
      //       fileName: "Worker_List_Report",
      //     }),
      // },
      {
        icon: PiMicrosoftExcelLogo,
        label: "Download Excel",
        onClick: () => {
          exportToExcel({
            title: "All Worker List Report",
            columns,
            data: filteredData,
            fileName: "Worker_List_Report",
          });
        },
      },
      {
        icon: FaPrint,
        label: "Print Page",
        onClick: () => window.print(),
      },
      {
        icon: HiOutlineLogout,
        label: "Logout",
        onClick: () => handleLogout(),
      },
      {
        icon: FaArrowUp,
        label: "Scroll To Top",
        onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
    ],
    [filteredData, columns, exportToPDF, exportToExcel]
  );

  return (
    <div>
      <ToastContainer />

      {/* Top Filters Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        {/* Left: Date Range */}
        <div>
          <DateRangeFilterCredence
            title="Date Range"
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Right: Search + Add Button */}
        <div className="flex flex-wrap justify-end items-center gap-2 w-full md:w-auto">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={handleSearch}
          />
          <AddButton
            label="Add TP Pass"
            onClick={() => {
              setEditMode(false);
              setEditingUser(null);
              setShowModalFrom(true);
            }}
          />
        </div>
      </div>

      {/* Modal */}
      <LorryForm
        show={showModalFrom}
        initialData={editMode ? editingUser : null}
        onClose={() => {
          setShowModalFrom(false);
          setEditMode(false);
          setEditingUser(null);
        }}
        onSubmit={handleFormSubmit}
        title={editMode ? "Edit TP Pass" : "Add New TP Pass"}
        size="xl"
        fields={fields}
        isSubmitting={
          addTpPassMutation.isPending || updateTpPassMutation.isPending
        }
      />

      {/* Table */}
      <Table
        title="All TP Receipt List"
        columns={columns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
        viewButton={true}
        handleViewButton={handleViewButton}
        viewButtonLabel="Invoice"

        // editButton={true}
        // handleEditButton={handleEditButton}
        // deleteButton={true}
        // handleDeleteButton={handleDeleteButton}
      />

      {/* Pagination */}
      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value === -1 ? filteredData.length : value);
          setCurrentPage(1);
        }}
      />

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-6xl p-6 relative shadow-lg">
            {/* Close Button */}
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-semibold mb-4">Invoice Bill</h2>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[70vh]">
              {selectedInvoiceData ? (
                <InvoiceBill invoiceData={selectedInvoiceData} />
              ) : (
                <p className="text-gray-500">No invoice data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* dpdf and excel */}
      <div className="fixed bottom-0 right-0 m-3 mb-1 z-50">
        <IconDropdown items={dropdownItems} />
      </div>
    </div>
  );
};

export default TpPass;
