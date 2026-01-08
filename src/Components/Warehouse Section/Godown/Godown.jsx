import React, { useEffect, useState } from "react";
import SearchInput from "../../ReusableComponents/SearchInput";
import Table from "../../ReusableComponents/Table";
import SmartPagination from "../../ReusableComponents/SmartPagination";
import { useQuery } from "@tanstack/react-query";
import { GetGodownApi } from "../data/data";
import { useNavigate } from "react-router-dom";

const Godown = () => {
  const navigate = useNavigate();

  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const normalizedSearch = searchQuery.trim() || undefined;

  const { data: warehouseRes, isFetching } = useQuery({
    queryKey: [
      "warehouse",
      { search: normalizedSearch, page: currentPage, limit: itemsPerPage },
    ],
    queryFn: GetGodownApi,
    keepPreviousData: true,

    //Data stays FRESH for 10 minutes (no refetch)
    staleTime: 10 * 60 * 1000, // 10 minutes

    //Data stays in cache for 10 minutes before being garbage-collected
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // FIXED: always update table data
  useEffect(() => {
    setFilteredData(warehouseRes?.data || []);
  }, [warehouseRes, searchQuery, currentPage, itemsPerPage]);

  const totalPages = warehouseRes?.totalPages || 1;

  const columns = [
    { label: "WareHouse Name", key: "wareHouseName", sortable: true },
    { label: "Location", key: "location", sortable: true },
  ];

  // View handler
  const handleViewButton = (id) => {
    // Use the correct path based on your routing configuration
    navigate(`/dashboard/warehouse/InventoryList/${id}`);
  };

  return (
    <>
      <div className="mb-3 w-100 d-flex justify-content-end">
        <div style={{ width: "250px" }}>
          {" "}
          {/* adjust width as needed */}
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Table
        title="Godown Section"
        columns={columns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
        viewButton={true}
        handleViewButton={handleViewButton}
      />

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          const newItems = value === -1 ? warehouseRes?.total || 9999 : value;
          setItemsPerPage(newItems);
          setCurrentPage(1);
        }}
      />
    </>
  );
};

export default Godown;
