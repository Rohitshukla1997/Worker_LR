import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "../ReusableComponents/Table";
import SmartPagination from "../ReusableComponents/SmartPagination";
import {
  fetchTpPassData,
  postLorryReciptApi,
  patchLorryReciptApi,
  deleteLorryReciptApi,
} from "./data/data";
import AddButton from "../ReusableComponents/AddButton";
import SearchInput from "../ReusableComponents/SearchInput";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import LorryForm from "../ReusableComponents/LorryFrom";
import DateRangeFilterCredence from "../ReusableComponents/DateRangeFilterCredence";

const TpPass = () => {
  const queryClient = useQueryClient();

  const {
    data: tpPass = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["tpPass"],
    queryFn: fetchTpPassData,
  });

  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  }); // Add date range state

  // form state
  const [showModalFrom, setShowModalFrom] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  //  Add mutation
  const addTpPassMutation = useMutation({
    mutationFn: postLorryReciptApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tpPass"] });
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
      queryClient.invalidateQueries({ queryKey: ["tpPass"] });
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
      queryClient.invalidateQueries({ queryKey: ["tpPass"] });
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
    if (Array.isArray(tpPass) && tpPass.length > 0) {
      setFilteredData(tpPass);
    } else {
      setFilteredData([]);
    }
  }, [tpPass]);

  //  handle add/edit form submission
  const handleFormSubmit = (formData) => {
    if (editMode && editingUser) {
      updateTpPassMutation.mutate({ id: editingUser._id, data: formData });
    } else {
      addTpPassMutation.mutate(formData);
    }
  };

  //  handle delete with confirmation
  const handleDelete = (id) => {
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
    { label: "Driver Name", key: "driverName", sortable: true },
    { label: "Driver Contact", key: "driverContact", sortable: true },
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
    { label: "Transporter Rate On", key: "transporterRateOn", sortable: true },
    { label: "Customer Rate On", key: "customerRateOn", sortable: true },
    { label: "Customer Freight", key: "customerFreight", sortable: true },
    { label: "Transporter Freight", key: "transporterFreight", sortable: true },
  ];

  // field data
  const fields = [
    // Company Details
    {
      name: "companyName",
      label: "Company Name",
      type: "text",
      placeholder: "Enter company name",
      section: "Company Details",
    },
    {
      name: "companyAddress",
      label: "Company Address",
      type: "text",
      placeholder: "Enter company address",
      section: "Company Details",
    },
    {
      name: "gstIn",
      label: "GST IN",
      type: "text",
      placeholder: "Enter GST IN",
      section: "Company Details",
    },
    {
      name: "companyEmail",
      label: "Company Email",
      type: "email",
      placeholder: "Enter company email",
      section: "Company Details",
    },
    {
      name: "companyMobileNumber",
      label: "Company Mobile Number",
      type: "text",
      placeholder: "Enter mobile number",
      section: "Company Details",
    },
    {
      name: "companyOfficeNumber",
      label: "Company Office Number",
      type: "text",
      placeholder: "Enter office number",
      section: "Company Details",
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
      name: "date",
      label: "Date",
      type: "date",
      placeholder: "Select date",
      section: "Basic Details",
      required: true,
    },
    {
      name: "vehicleName",
      label: "Vehicle Name",
      type: "text",
      placeholder: "Enter vehicle name",
      section: "Basic Details",
      required: true,
    },
    {
      name: "driverName",
      label: "Driver Name",
      type: "text",
      placeholder: "Enter driver name",
      section: "Basic Details",
      required: true,
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
        deleteButton
        editButton
        handleDeleteButton={handleDelete}
        handleEditButton={(id) => {
          const item = filteredData.find((d) => d._id === id);
          setEditingUser(item);
          setEditMode(true);
          setShowModalFrom(true);
        }}
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
    </div>
  );
};

export default TpPass;
