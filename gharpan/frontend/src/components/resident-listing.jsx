import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Users,
  Calendar,
  Filter,
  Download,
  Trash2,
  X,
  ChevronDown,
  Activity,
  ExternalLink,
  Edit,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast, ToastContainer } from "./ToastNotification";
import ConfirmDialog from "./ConfirmDialog";

const ResidentsListing = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewResident, setPreviewResident] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateResident, setUpdateResident] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  // FIXED: Better form state management using useState instead of useRef for better React practices
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  // Sorting state
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortField, setSortField] = useState("name");

  // Advanced filter states
  const [filters, setFilters] = useState({
    gender: "",
    healthStatus: "",
    admissionStatus: "",
    category: "",
    bloodGroup: "",
    state: "",
    ageRange: { min: "", max: "" },
    admissionDateRange: { start: "", end: "" },
    disabilityStatus: "",
    rehabStatus: "",
  });

  // Utility function to check for valid ObjectId
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const getResidentStatusBadgeClass = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized.includes("death") || normalized.includes("body")) {
      return "bg-gray-900 text-white";
    }
    if (normalized.includes("discharge") || normalized.includes("transfer")) {
      return "bg-orange-100 text-orange-800";
    }
    if (normalized.includes("admission") || normalized.includes("active")) {
      return "bg-emerald-100 text-emerald-800";
    }
    return "bg-slate-100 text-slate-800";
  };

  const isResidentDeceased = (resident) => {
    const normalizedStatus = (resident?.admissionStatus || "").toLowerCase();
    return normalizedStatus.includes("death") || normalizedStatus.includes("body donation");
  };

  const getDisplayedHealthStatus = (resident) => {
    if (isResidentDeceased(resident)) {
      return "Death";
    }
    const normalizedHealthStatus = (resident?.healthStatus || "").trim();
    return normalizedHealthStatus || "N/A";
  };

  const getHealthStatusDisplayValue = (status) => {
    const normalizedStatus = (status || "").trim();
    return normalizedStatus || "N/A";
  };

  const getHealthStatusBadgeClass = (resident) => {
    const displayedStatus = getDisplayedHealthStatus(resident).toLowerCase();

    if (displayedStatus.includes("death")) {
      return "bg-gray-900 text-white";
    }
    if (displayedStatus.includes("good")) {
      return "bg-green-100 text-green-800";
    }
    if (displayedStatus.includes("critical")) {
      return "bg-red-100 text-red-800";
    }
    if (displayedStatus.includes("fair")) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (displayedStatus.includes("stable")) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getPhotoStatusContextLabel = (status) => {
    const normalizedStatus = (status || "").trim();
    return normalizedStatus || "Status";
  };

  const normalizeHealthStatusValue = (status) => {
    const allowedHealthStatuses = [
      "Excellent",
      "Good",
      "Fair",
      "Poor",
      "Critical",
      "Stable",
      "Improving",
      "Declining",
    ];

    const normalizedStatus = (status || "").trim();
    return allowedHealthStatuses.includes(normalizedStatus)
      ? normalizedStatus
      : "";
  };

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Fetch residents data
  const fetchResidents = async (page = 1, search = "", appliedFilters = {}, sort = { field: sortField, order: sortOrder }) => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: search,
        sortField: sort.field,
        sortOrder: sort.order,
      });

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          if (key === "ageRange") {
            if (value.min) params.append("ageMin", value.min);
            if (value.max) params.append("ageMax", value.max);
          } else if (key === "admissionDateRange") {
            if (value.start) params.append("admissionDateStart", value.start);
            if (value.end) params.append("admissionDateEnd", value.end);
          } else {
            params.append(key, value);
          }
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `/api/residents?${params.toString()}`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setResidents(result.data);
        setTotalPages(result.pagination.totalPages);
        setCurrentPage(result.pagination.currentPage);
        setError("");
      } else {
        setError(result.message || "Failed to fetch residents");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError("Network error. Please check if the server is running.");
      }
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single resident details
  const fetchResidentDetails = async (id) => {
    try {
      const response = await fetch(`/api/residents/${id}`);
      const result = await response.json();

      if (result.success) {
        setSelectedResident(result.data);
        setShowDetails(true);
      } else {
        setError(result.message || "Failed to fetch resident details");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Fetch details error:", err);
    }
  };

  // Delete resident
  const deleteResident = async (id) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/residents/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      console.log('Delete resident response:', { status: response.status, result });

      if (result.success) {
        setResidents(residents.filter((resident) => resident._id !== id));
        setShowDeleteConfirm(null);
        setError("");
      } else {
        setError(result.message || `Failed to delete resident (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Delete resident error:', err, { id });
      setError(`Network error: ${err.message}. Please try again.`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // FIXED: Handle update resident - preserve existing values
  const handleUpdateClick = (resident) => {
    console.log("Opening update modal for resident:", resident._id);
    setUpdateResident(resident);

    // FIXED: Create form data while preserving all existing values
    const initialFormData = {
      // Basic Information
      registrationNo: resident.registrationNo || "",
      admissionDate: resident.admissionDate || "",
      name: resident.name || "",
      nameGivenByOrganization: resident.nameGivenByOrganization || "",
      age: resident.age || "",
      gender: resident.gender || "",
      dateOfBirth: resident.dateOfBirth || "",
      weight: resident.weight || "",
      height: resident.height || "",
      religion: resident.religion || "",
      identificationMark: resident.identificationMark || "",

      // Contact Information
      mobileNo: resident.mobileNo || "",
      phoneNumber: resident.phoneNumber || "",
      alternativeContact: resident.alternativeContact || "",
      emailAddress: resident.emailAddress || "",
      socialMediaHandle: resident.socialMediaHandle || "",
      relativeAdmit: resident.relativeAdmit || "",
      relationWith: resident.relationWith || "",
      emergencyContactName: resident.emergencyContactName || "",
      emergencyContactNumber: resident.emergencyContactNumber || "",
      emergencyContactRelationship: resident.emergencyContactRelationship || "",
      voterId: resident.voterId || "",
      aadhaarNumber: resident.aadhaarNumber || "",

      // Health Information
      healthStatus: normalizeHealthStatusValue(resident.healthStatus),
      category: resident.category || "",
      bloodGroup: resident.bloodGroup || "",
      bodyTemperature: resident.bodyTemperature || "",
      heartRate: resident.heartRate || "",
      respiratoryRate: resident.respiratoryRate || "",
      bloodPressure: resident.bloodPressure || "",
      allergies: resident.allergies || "",
      knownAllergies: resident.knownAllergies || "",
      medicalConditions: resident.medicalConditions || "",
      medications: resident.medications || "",
      disabilityStatus: resident.disabilityStatus || "",
      disabilityDetails: resident.disabilityDetails || "",
      rehabStatus: resident.rehabStatus || "",
      medicalHistoryNotes: resident.medicalHistoryNotes || "",
      medicalHistory: resident.medicalHistory || "",
      primaryDoctor: resident.primaryDoctor || "",
      preferredHospital: resident.preferredHospital || "",

      // Address Information
      address: {
        fullAddress: resident.address?.fullAddress || "",
        city: resident.address?.city || "",
        district: resident.address?.district || "",
        state: resident.address?.state || "",
        country: resident.address?.country || "",
        pincode: resident.address?.pincode || "",
        latitude: resident.address?.latitude || "",
        longitude: resident.address?.longitude || "",
      },
      alternativeAddress: resident.alternativeAddress || "",
      nearestLandmark: resident.nearestLandmark || "",
      distanceFromFacility: resident.distanceFromFacility || "",

      // Informer Information
      informerName: resident.informerName || "",
      informerMobile: resident.informerMobile || "",
      informerRelationship: resident.informerRelationship || "",
      informationDate: resident.informationDate || "",
      informerAddress: resident.informerAddress || "",
      informationDetails: resident.informationDetails || "",

      // Transport & Organization Information
      conveyanceVehicleNo: resident.conveyanceVehicleNo || "",
      pickUpPlace: resident.pickUpPlace || "",
      pickUpTime: resident.pickUpTime || "",
      entrantName: resident.entrantName || "",
      driverName: resident.driverName || "",
      driverMobile: resident.driverMobile || "",
      admittedBy: resident.admittedBy || "",
      ward: resident.ward || "",
      organizationId: resident.organizationId || "",
      admissionStatus: resident.admissionStatus || "",
      statusDate: resident.statusDate || "",
      transportNotes: resident.transportNotes || "",
      receiptNo: resident.receiptNo || "",
      letterNo: resident.letterNo || "",
      itemDescription: resident.itemDescription || "",
      itemAmount: resident.itemAmount || "",
      videoUrl: resident.videoUrl || "",

      // Additional Information
      comments: resident.comments || "",
      generalComments: resident.generalComments || "",
      medicalNotes: resident.medicalNotes || "",
      behavioralNotes: resident.behavioralNotes || "",
      careInstructions: resident.careInstructions || "",
      priorityLevel: resident.priorityLevel || "",
      lastUpdateDate: resident.lastUpdateDate || "",
      updatedBy: resident.updatedBy || "",
      updateSummary: resident.updateSummary || "",
    };

    setOriginalData({ ...initialFormData });
    setFormData({ ...initialFormData });
    setChangedFields(new Set());
    setShowUpdateModal(true);
  };

  // FIXED: Handle form input changes - track only changed fields
  const handleFormInputChange = (fieldName, value) => {
    let cleanedValue = value;

    // Input validation and cleaning
    if (
      fieldName === "age" ||
      fieldName === "weight" ||
      fieldName === "height" ||
      fieldName === "itemAmount" ||
      fieldName === "bodyTemperature" ||
      fieldName === "heartRate" ||
      fieldName === "respiratoryRate" ||
      fieldName === "distanceFromFacility"
    ) {
      if (cleanedValue !== "" && (isNaN(cleanedValue) || Number(cleanedValue) < 0)) {
        return;
      }
    }

    if (
      fieldName === "mobileNo" ||
      fieldName === "driverMobile" ||
      fieldName === "informerMobile" ||
      fieldName === "emergencyContactNumber"
    ) {
      cleanedValue = cleanedValue.replace(/[^0-9]/g, "");
      if (cleanedValue.length > 10) {
        cleanedValue = cleanedValue.slice(0, 10);
      }
    }

    if (fieldName === "aadhaarNumber") {
      cleanedValue = cleanedValue.replace(/[^0-9]/g, "");
      if (cleanedValue.length > 12) {
        cleanedValue = cleanedValue.slice(0, 12);
      }
    }

    setFormData(prevData => {
      const newData = { ...prevData };
      if (fieldName.startsWith('address.')) {
        const addressField = fieldName.split('.')[1];
        newData.address = { ...newData.address, [addressField]: cleanedValue };
      } else {
        newData[fieldName] = cleanedValue;
      }
      return newData;
    });

    setChangedFields(prev => {
      const newSet = new Set(prev);
      const originalValue = fieldName.startsWith('address.')
        ? originalData.address?.[fieldName.split('.')[1]]
        : originalData[fieldName];

      if (String(cleanedValue) !== String(originalValue)) {
        newSet.add(fieldName);
      } else {
        newSet.delete(fieldName);
      }
      return newSet;
    });
  };

  // FIXED: Update resident data - send only changed fields
  const updateResidentData = async () => {
    if (changedFields.size === 0) {
      setError("No changes detected to save.");
      return;
    }

    setUpdateLoading(true);
    try {
      const updatePayload = {};

      changedFields.forEach(fieldName => {
        if (fieldName.startsWith('address.')) {
          if (!updatePayload.address) {
            updatePayload.address = {};
          }
          const addressField = fieldName.split('.')[1];
          updatePayload.address[addressField] = formData.address[addressField];
        } else {
          updatePayload[fieldName] = formData[fieldName];
        }
      });

      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === "") {
          updatePayload[key] = null;
        }

        // Handle numeric fields
        if (
          (key === "age" ||
            key === "weight" ||
            key === "height" ||
            key === "itemAmount" ||
            key === "bodyTemperature" ||
            key === "heartRate" ||
            key === "respiratoryRate" ||
            key === "distanceFromFacility") &&
          updatePayload[key] !== null &&
          updatePayload[key] !== ""
        ) {
          updatePayload[key] = Number(updatePayload[key]);
        }
      });

      if (updatePayload.address) {
        Object.keys(updatePayload.address).forEach((key) => {
          if (updatePayload.address[key] === "") {
            updatePayload.address[key] = null;
          }
        });
      }

      console.log("Sending update payload (only changed fields):", updatePayload);
      console.log("Changed fields:", Array.from(changedFields));

      const response = await fetch(
        `/api/residents/${updateResident._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      const result = await response.json();

      if (result.success) {
        setResidents(prevResidents =>
          prevResidents.map((resident) =>
            resident._id === updateResident._id
              ? { ...resident, ...result.data }
              : resident
          )
        );

        closeUpdateModal(); // Use the dedicated close function
        setError("Resident updated successfully!");
        setTimeout(() => setError(""), 3000);

        console.log("Update successful");
      } else {
        console.error("Update failed:", result);
        setError(result.message || "Failed to update resident");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Network error. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Close update modal
  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateResident(null);
    setFormData({});
    setOriginalData({});
    setChangedFields(new Set());
    setError(""); // Clear any error messages from the modal
  };

  // Handle sorting
  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    fetchResidents(1, searchTerm, filters, { field, order: newOrder });
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchResidents(currentPage, searchTerm, filters, { field: sortField, order: sortOrder });
  }, [currentPage, sortField, sortOrder]);

  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      fetchResidents(1, searchValue, filters, { field: sortField, order: sortOrder });
    }, 500),
    [filters, sortField, sortOrder]
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      debouncedSearch(value);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchResidents(1, searchTerm, filters, { field: sortField, order: sortOrder });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchResidents(page, searchTerm, filters, { field: sortField, order: sortOrder });
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchResidents(1, searchTerm, filters, { field: sortField, order: sortOrder });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      gender: "",
      healthStatus: "",
      admissionStatus: "",
      category: "",
      bloodGroup: "",
      state: "",
      ageRange: { min: "", max: "" },
      admissionDateRange: { start: "", end: "" },
      disabilityStatus: "",
      rehabStatus: "",
    };
    setFilters(clearedFilters);
    fetchResidents(1, searchTerm, clearedFilters, { field: sortField, order: sortOrder });
  };

  // Export to Excel
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        export: "true",
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          if (key === "ageRange") {
            if (value.min) params.append("ageMin", value.min);
            if (value.max) params.append("ageMax", value.max);
          } else if (key === "admissionDateRange") {
            if (value.start) params.append("admissionDateStart", value.start);
            if (value.end) params.append("admissionDateEnd", value.end);
          } else {
            params.append(key, value);
          }
        }
      });

      const response = await fetch(
        `/api/residents/export?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `residents_export_${new Date().toISOString().split("T")[0]
          }.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to export data. Please try again.");
      }
    } catch (err) {
      setError("Export failed. Please check your connection.");
      console.error("Export error:", err);
    } finally {
      setExportLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (resident) => {
    fetchResidentDetails(resident._id);
  };

  // Download individual resident details with confirmation
  const downloadResidentDetails = async (
    residentId,
    registrationNo,
    residentName
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: "Download Resident Details",
      message: `Download resident details for:\n\nName: ${residentName || "N/A"}\nRegistration No: ${registrationNo || "N/A"}\n\nThis will generate a comprehensive PDF report with all resident information.\n\nDo you want to proceed with the download?`,
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });

        try {
          console.log("Downloading resident details for:", residentId);
          showInfo("Generating PDF report... Please wait.");

          const response = await fetch(
            `/api/residents/${residentId}/download?format=pdf&template=detailed`
          );

          console.log("Download response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Download error response:", errorText);
            throw new Error(
              `Download failed with status ${response.status}: ${errorText}`
            );
          }

          const blob = await response.blob();
          console.log("Downloaded blob size:", blob.size, "bytes");

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `resident-${registrationNo || residentId}-details.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log("Resident details downloaded successfully as PDF");
          showSuccess("PDF downloaded successfully!");
        } catch (error) {
          console.error("Download error:", error);
          showError(`Failed to download resident details: ${error.message}`);
        }
      }
    });
  };

  // Print individual resident details
  const printResidentDetails = async (
    residentId,
    registrationNo,
    residentName
  ) => {
    try {
      console.log("Preparing to print resident details for:", residentId);
      showInfo("Preparing PDF for printing... Please wait.");

      const printUrl = `/api/residents/${residentId}/print?template=detailed`;
      const printWindow = window.open(
        printUrl,
        "_blank",
        "width=800,height=600"
      );

      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            console.log("Print dialog opened successfully");
            showSuccess("Print dialog opened successfully!");
          }, 1000);
        };
      } else {
        showError("Pop-up blocked. Please allow pop-ups for printing.");
      }
    } catch (error) {
      console.error("Print error:", error);
      showError(`Failed to prepare PDF for printing: ${error.message}`);
    }
  };

  // Preview resident details as PDF
  const previewResidentDetails = async (
    residentId,
    residentName,
    registrationNo
  ) => {
    try {
      setPreviewResident({ name: residentName, registrationNo });
      const previewUrl = `/api/residents/${residentId}/preview`;
      setPreviewUrl(previewUrl);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Preview error:", error);
      showError(`Failed to preview resident details: ${error.message}`);
    }
  };

  // Close preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl("");
    setPreviewResident(null);
  };


  // Close details modal
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedResident(null);
  };


  // Handle delete confirmation
  const handleDeleteClick = (resident) => {
    setShowDeleteConfirm(resident);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteResident(showDeleteConfirm._id);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            Confirm Delete
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete resident "{showDeleteConfirm.name}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={deleteLoading === showDeleteConfirm._id}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteLoading === showDeleteConfirm._id}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading === showDeleteConfirm._id
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update Resident Modal Component - FIXED
const UpdateResidentModal = () => {
  if (!showUpdateModal || !updateResident) return null;

  // KEY FIX: Use local state to prevent parent re-renders on every keystroke
  const [localFormData, setLocalFormData] = useState({
    ...formData,
    healthStatus: normalizeHealthStatusValue(formData.healthStatus),
  });
  const [activeSection, setActiveSection] = useState("basic"); // Section navigation state

  // Sync local state when modal opens
  useEffect(() => {
    setLocalFormData({
      ...formData,
      healthStatus: normalizeHealthStatusValue(formData.healthStatus),
    });
  }, [showUpdateModal, formData]);

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  // LOCAL handler - updates only local state (fast, no parent re-render)
  const handleLocalInputChange = (fieldName, value) => {
    setLocalFormData(prevData => {
      const newData = { ...prevData };
      if (fieldName.startsWith('address.')) {
        const addressField = fieldName.split('.')[1];
        newData.address = { ...newData.address, [addressField]: value };
      } else {
        newData[fieldName] = value;
      }
      return newData;
    });
  };

  // PARENT handler - called on blur to track changes
  const handleInputBlur = (fieldName, value) => {
    handleFormInputChange(fieldName, value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-50 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        key={updateResident._id}
      >
        {/* Modal Header */}
        <div className="bg-white p-6 border-b border-gray-200 rounded-t-lg shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Update Resident Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {updateResident.name ||
                  updateResident.nameGivenByOrganization}{" "}
                - {updateResident.registrationNo}
              </p>
              {changedFields.size > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  {changedFields.size} field{changedFields.size > 1 ? "s" : ""} modified
                </p>
              )}
            </div>
            <button
              onClick={closeUpdateModal}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              type="button"
            >
              ×
            </button>
          </div>
          
          {/* Section Navigation Tabs */}
          <div className="mt-3 pb-3 border-bottom">
            <div className="btn-group btn-group-sm" role="group" aria-label="Section navigation">
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to basic");
                  setActiveSection("basic");
                }}
                className={`btn ${
                  activeSection === "basic"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
              >
                📋 Basic
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to contact");
                  setActiveSection("contact");
                }}
                className={`btn ${
                  activeSection === "contact"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
              >
                📞 Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to health");
                  setActiveSection("health");
                }}
                className={`btn ${
                  activeSection === "health"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
              >
                🏥 Health
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to admin");
                  setActiveSection("admin");
                }}
                className={`btn ${
                  activeSection === "admin"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
              >
                ⚙️ Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to documents");
                  setActiveSection("documents");
                }}
                className={`btn ${
                  activeSection === "documents"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
              >
                📄 Docs
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Switching to review");
                  setActiveSection("review");
                }}
                className={`btn ${
                  activeSection === "review"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
              >
                ✅ Review
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div
          className="p-6 space-y-6 overflow-y-auto flex-1"
          style={{
            scrollBehavior: 'auto'
          }}
        >
          {/* Error Display */}
          {error && error.includes("updated successfully") ? (
            <div
              className="alert alert-success d-flex align-items-center"
              role="alert"
            >
              <div>{error}</div>
            </div>
          ) : error && !error.includes("updated successfully") && !error.includes("No changes detected") ? (
            <div
              className="alert alert-danger d-flex align-items-center"
              role="alert"
            >
              <div>{error}</div>
            </div>
          ) : error && error.includes("No changes detected") ? (
            <div
              className="alert alert-warning d-flex align-items-center"
              role="alert"
            >
              <div>{error}</div>
            </div>
          ) : null}

          {/* Basic Information Section */}
          {activeSection === "basic" && (
          <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Basic Information
            </h3>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Registration Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.registrationNo || ""}
                  onChange={(e) => handleLocalInputChange("registrationNo", e.target.value)}
                  onBlur={(e) => handleInputBlur("registrationNo", e.target.value)}
                  placeholder="Registration number"
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
                <small className="text-muted">Registration number cannot be changed</small>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Admission Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(localFormData.admissionDate)}
                  onChange={(e) => handleLocalInputChange("admissionDate", e.target.value)}
                  onBlur={(e) => handleInputBlur("admissionDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.name || ""}
                  onChange={(e) => handleLocalInputChange("name", e.target.value)}
                  onBlur={(e) => handleInputBlur("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Name Given by Organization
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.nameGivenByOrganization || ""}
                  onChange={(e) => handleLocalInputChange("nameGivenByOrganization", e.target.value)}
                  onBlur={(e) => handleInputBlur("nameGivenByOrganization", e.target.value)}
                  placeholder="Organization assigned name"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(localFormData.dateOfBirth)}
                  onChange={(e) => handleLocalInputChange("dateOfBirth", e.target.value)}
                  onBlur={(e) => handleInputBlur("dateOfBirth", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Age
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.age || ""}
                  onChange={(e) => handleLocalInputChange("age", e.target.value)}
                  onBlur={(e) => handleInputBlur("age", e.target.value)}
                  placeholder="Age in years"
                  min="0"
                  max="150"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Gender
                </label>
                <select
                  className="form-select"
                  value={localFormData.gender || ""}
                  onChange={(e) => {
                    handleLocalInputChange("gender", e.target.value);
                    handleInputBlur("gender", e.target.value);
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.weight || ""}
                  onChange={(e) => handleLocalInputChange("weight", e.target.value)}
                  onBlur={(e) => handleInputBlur("weight", e.target.value)}
                  placeholder="Weight in kg"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.height || ""}
                  onChange={(e) => handleLocalInputChange("height", e.target.value)}
                  onBlur={(e) => handleInputBlur("height", e.target.value)}
                  placeholder="Height in cm"
                  min="0"
                  max="300"
                  step="0.1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Religion
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.religion || ""}
                  onChange={(e) => handleLocalInputChange("religion", e.target.value)}
                  onBlur={(e) => handleInputBlur("religion", e.target.value)}
                  placeholder="Religion"
                />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Identification Mark
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.identificationMark || ""}
                  onChange={(e) => handleLocalInputChange("identificationMark", e.target.value)}
                  onBlur={(e) => handleInputBlur("identificationMark", e.target.value)}
                  placeholder="Any identifying marks or features"
                />
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection("contact")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Contact →
              </button>
            </div>
          </div>
          )}

          {/* Contact Information Section */}
          {activeSection === "contact" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Contact Information
            </h3>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={localFormData.mobileNo || ""}
                  onChange={(e) => handleLocalInputChange("mobileNo", e.target.value)}
                  onBlur={(e) => handleInputBlur("mobileNo", e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Alternative Contact
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={localFormData.phoneNumber || localFormData.alternativeContact || ""}
                  onChange={(e) => handleLocalInputChange("phoneNumber", e.target.value)}
                  onBlur={(e) => handleInputBlur("phoneNumber", e.target.value)}
                  placeholder="Alternative contact number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={localFormData.emailAddress || ""}
                  onChange={(e) => handleLocalInputChange("emailAddress", e.target.value)}
                  onBlur={(e) => handleInputBlur("emailAddress", e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Social Media Handle
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.socialMediaHandle || ""}
                  onChange={(e) => handleLocalInputChange("socialMediaHandle", e.target.value)}
                  onBlur={(e) => handleInputBlur("socialMediaHandle", e.target.value)}
                  placeholder="Social media profile"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Relative Who Admitted
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.relativeAdmit || ""}
                  onChange={(e) => handleLocalInputChange("relativeAdmit", e.target.value)}
                  onBlur={(e) => handleInputBlur("relativeAdmit", e.target.value)}
                  placeholder="Name of relative who admitted"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Relation with Admitter
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.relationWith || ""}
                  onChange={(e) => handleLocalInputChange("relationWith", e.target.value)}
                  onBlur={(e) => handleInputBlur("relationWith", e.target.value)}
                  placeholder="Relationship with person who admitted"
                />
              </div>

              {/* Emergency Contact */}
              <div className="col-12 mt-4">
                <h5 className="text-danger mb-3">
                  Emergency Contact
                </h5>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.emergencyContactName || ""}
                  onChange={(e) => handleLocalInputChange("emergencyContactName", e.target.value)}
                  onBlur={(e) => handleInputBlur("emergencyContactName", e.target.value)}
                  placeholder="Emergency contact person"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={localFormData.emergencyContactNumber || ""}
                  onChange={(e) => handleLocalInputChange("emergencyContactNumber", e.target.value)}
                  onBlur={(e) => handleInputBlur("emergencyContactNumber", e.target.value)}
                  placeholder="Emergency contact number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Emergency Contact Relationship
                </label>
                <select
                  className="form-select"
                  value={localFormData.emergencyContactRelationship || ""}
                  onChange={(e) => {
                    handleLocalInputChange("emergencyContactRelationship", e.target.value);
                    handleInputBlur("emergencyContactRelationship", e.target.value);
                  }}
                >
                  <option value="">Select Relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Social Worker">Social Worker</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Identity Documents */}
              <div className="col-12 mt-4">
                <h5 className="text-info mb-3">
                  Identity Documents
                </h5>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Voter ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.voterId || ""}
                  onChange={(e) => handleLocalInputChange("voterId", e.target.value)}
                  onBlur={(e) => handleInputBlur("voterId", e.target.value)}
                  placeholder="Voter ID number"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.aadhaarNumber || ""}
                  onChange={(e) => handleLocalInputChange("aadhaarNumber", e.target.value)}
                  onBlur={(e) => handleInputBlur("aadhaarNumber", e.target.value)}
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                  pattern="[0-9]{12}"
                />
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("basic")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("health")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Health →
              </button>
            </div>
          </div>
          )}

          {/* Health Information Section */}
          {activeSection === "health" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Health Information
            </h3>
            <div className="row g-4">
              {/* General Health Status */}
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Health Status
                </label>
                <select
                  className="form-select"
                  value={normalizeHealthStatusValue(localFormData.healthStatus)}
                  onChange={(e) => {
                    handleLocalInputChange("healthStatus", e.target.value);
                    handleInputBlur("healthStatus", e.target.value);
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Critical">Critical</option>
                  <option value="Stable">Stable</option>
                  <option value="Improving">Improving</option>
                  <option value="Declining">Declining</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Blood Group
                </label>
                <select
                  className="form-select"
                  value={localFormData.bloodGroup || ""}
                  onChange={(e) => {
                    handleLocalInputChange("bloodGroup", e.target.value);
                    handleInputBlur("bloodGroup", e.target.value);
                  }}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Category
                </label>
                <select
                  className="form-select"
                  value={localFormData.category || ""}
                  onChange={(e) => {
                    handleLocalInputChange("category", e.target.value);
                    handleInputBlur("category", e.target.value);
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Other">Other</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Routine">Routine</option>
                </select>
              </div>

              {/* Vital Signs */}
              <div className="col-12 mt-4">
                <h5 className="text-info mb-3">
                  Vital Signs & Physical Metrics
                </h5>
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Body Temperature (°C)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.bodyTemperature || ""}
                  onChange={(e) => handleLocalInputChange("bodyTemperature", e.target.value)}
                  onBlur={(e) => handleInputBlur("bodyTemperature", e.target.value)}
                  placeholder="Normal: 36.5-37.5"
                  min="30"
                  max="45"
                  step="0.1"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.heartRate || ""}
                  onChange={(e) => handleLocalInputChange("heartRate", e.target.value)}
                  onBlur={(e) => handleInputBlur("heartRate", e.target.value)}
                  placeholder="Normal: 60-100"
                  min="40"
                  max="200"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.respiratoryRate || ""}
                  onChange={(e) => handleLocalInputChange("respiratoryRate", e.target.value)}
                  onBlur={(e) => handleInputBlur("respiratoryRate", e.target.value)}
                  placeholder="Normal: 12-20"
                  min="10"
                  max="60"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Blood Pressure
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.bloodPressure || ""}
                  onChange={(e) => handleLocalInputChange("bloodPressure", e.target.value)}
                  onBlur={(e) => handleInputBlur("bloodPressure", e.target.value)}
                  placeholder="e.g., 120/80"
                />
              </div>

              {/* Disability and Medical History */}
              <div className="col-12 mt-4">
                <h5 className="text-warning mb-3">
                  Disability & Medical History
                </h5>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Disability Status
                </label>
                <select
                  className="form-select"
                  value={localFormData.disabilityStatus || ""}
                  onChange={(e) => {
                    handleLocalInputChange("disabilityStatus", e.target.value);
                    handleInputBlur("disabilityStatus", e.target.value);
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="None">No Disability</option>
                  <option value="Physical">Physical Disability</option>
                  <option value="Mental">Mental Disability</option>
                  <option value="Intellectual">Intellectual Disability</option>
                  <option value="Sensory">Sensory Disability</option>
                  <option value="Multiple">Multiple Disabilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Rehabilitation Status
                </label>
                <select
                  className="form-select"
                  value={localFormData.rehabStatus || ""}
                  onChange={(e) => {
                    handleLocalInputChange("rehabStatus", e.target.value);
                    handleInputBlur("rehabStatus", e.target.value);
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="Not Required">Not Required</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Required but not started">Required but not started</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Disability Details
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.disabilityDetails || ""}
                  onChange={(e) => handleLocalInputChange("disabilityDetails", e.target.value)}
                  onBlur={(e) => handleInputBlur("disabilityDetails", e.target.value)}
                  placeholder="Detailed description of disability, limitations, or special needs"
                />
              </div>

              {/* Allergies and Medical Conditions */}
              <div className="col-12 mt-4">
                <h5 className="text-danger mb-3">
                  Allergies & Medical Conditions
                </h5>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Known Allergies
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={localFormData.allergies || ""}
                  onChange={(e) => handleLocalInputChange("allergies", e.target.value)}
                  onBlur={(e) => handleInputBlur("allergies", e.target.value)}
                  placeholder="List any known allergies (food, medication, environmental)"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Medical Conditions
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={localFormData.medicalConditions || ""}
                  onChange={(e) => handleLocalInputChange("medicalConditions", e.target.value)}
                  onBlur={(e) => handleInputBlur("medicalConditions", e.target.value)}
                  placeholder="Current medical conditions, chronic illnesses, past surgeries"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Current Medications
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={localFormData.medications || ""}
                  onChange={(e) => handleLocalInputChange("medications", e.target.value)}
                  onBlur={(e) => handleInputBlur("medications", e.target.value)}
                  placeholder="List current medications with dosage and frequency"
                />
              </div>

              {/* Additional Health Information */}
              <div className="col-12 mt-4">
                <h5 className="text-success mb-3">
                  Additional Health Information
                </h5>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Primary Doctor
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.primaryDoctor || ""}
                  onChange={(e) => handleLocalInputChange("primaryDoctor", e.target.value)}
                  onBlur={(e) => handleInputBlur("primaryDoctor", e.target.value)}
                  placeholder="Name of primary doctor"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Preferred Hospital
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.preferredHospital || ""}
                  onChange={(e) => handleLocalInputChange("preferredHospital", e.target.value)}
                  onBlur={(e) => handleInputBlur("preferredHospital", e.target.value)}
                  placeholder="Preferred hospital for treatment"
                />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Medical History Notes
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.medicalHistory || ""}
                  onChange={(e) => handleLocalInputChange("medicalHistory", e.target.value)}
                  onBlur={(e) => handleInputBlur("medicalHistory", e.target.value)}
                  placeholder="Additional medical history, family history, or important notes"
                />
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("contact")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("admin")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Admin →
              </button>
            </div>
          </div>
          )}

          {/* Admin Section - Combines Address, Informer, Transport, Comments */}
          {activeSection === "admin" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3 className="heading mb-4" style={{ fontWeight: 700, fontSize: "1.3rem", color: "#0A400C" }}>
              Administrative Information
            </h3>

            {/* Address - Compact */}
            <div className="mb-4">
              <h5 className="text-primary mb-3 fw-bold">📍 Address</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" style={{ fontWeight: 600 }}>Full Address</label>
                  <textarea className="form-control" rows="2" value={localFormData.address?.fullAddress || ""} onChange={(e) => handleLocalInputChange("address.fullAddress", e.target.value)} onBlur={(e) => handleInputBlur("address.fullAddress", e.target.value)} placeholder="Complete address" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>City</label>
                  <input type="text" className="form-control" value={localFormData.address?.city || ""} onChange={(e) => handleLocalInputChange("address.city", e.target.value)} onBlur={(e) => handleInputBlur("address.city", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>State</label>
                  <input type="text" className="form-control" value={localFormData.address?.state || ""} onChange={(e) => handleLocalInputChange("address.state", e.target.value)} onBlur={(e) => handleInputBlur("address.state", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>PIN</label>
                  <input type="text" className="form-control" value={localFormData.address?.pincode || ""} onChange={(e) => handleLocalInputChange("address.pincode", e.target.value)} onBlur={(e) => handleInputBlur("address.pincode", e.target.value)} maxLength="6" />
                </div>
              </div>
            </div>

            {/* Informer */}
            <div className="mb-4 pt-3 border-top">
              <h5 className="text-info mb-3 fw-bold">ℹ️ Informer Details</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>Name</label>
                  <input type="text" className="form-control" value={localFormData.informerName || ""} onChange={(e) => handleLocalInputChange("informerName", e.target.value)} onBlur={(e) => handleInputBlur("informerName", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>Mobile</label>
                  <input type="tel" className="form-control" value={localFormData.informerMobile || ""} onChange={(e) => handleLocalInputChange("informerMobile", e.target.value)} onBlur={(e) => handleInputBlur("informerMobile", e.target.value)} maxLength="10" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>Ward</label>
                  <input type="text" className="form-control" value={localFormData.ward || ""} onChange={(e) => handleLocalInputChange("ward", e.target.value)} onBlur={(e) => handleInputBlur("ward", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Transport */}
            <div className="mb-4 pt-3 border-top">
              <h5 className="text-success mb-3 fw-bold">🚗 Transport & Admin</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Vehicle No</label>
                  <input type="text" className="form-control" value={localFormData.conveyanceVehicleNo || ""} onChange={(e) => handleLocalInputChange("conveyanceVehicleNo", e.target.value)} onBlur={(e) => handleInputBlur("conveyanceVehicleNo", e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Admitted By</label>
                  <input type="text" className="form-control" value={localFormData.admittedBy || ""} onChange={(e) => handleLocalInputChange("admittedBy", e.target.value)} onBlur={(e) => handleInputBlur("admittedBy", e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Receipt No</label>
                  <input type="text" className="form-control" value={localFormData.receiptNo || ""} onChange={(e) => handleLocalInputChange("receiptNo", e.target.value)} onBlur={(e) => handleInputBlur("receiptNo", e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                  <select className="form-select" value={localFormData.admissionStatus || ""} onChange={(e) => { handleLocalInputChange("admissionStatus", e.target.value); handleInputBlur("admissionStatus", e.target.value); }}>
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Status Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formatDateForInput(localFormData.statusDate) || ""}
                    onChange={(e) => handleLocalInputChange("statusDate", e.target.value)}
                    onBlur={(e) => handleInputBlur("statusDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="mb-4 pt-3 border-top">
              <h5 className="text-warning mb-3 fw-bold">📝 Notes</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600 }}>General Comments</label>
                  <textarea className="form-control" rows="3" value={localFormData.comments || ""} onChange={(e) => handleLocalInputChange("comments", e.target.value)} onBlur={(e) => handleInputBlur("comments", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600 }}>Medical Notes</label>
                  <textarea className="form-control" rows="3" value={localFormData.medicalNotes || ""} onChange={(e) => handleLocalInputChange("medicalNotes", e.target.value)} onBlur={(e) => handleInputBlur("medicalNotes", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button type="button" onClick={() => setActiveSection("health")} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                ← Health
              </button>
              <button type="button" onClick={() => setActiveSection("documents")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Next: Documents →
              </button>
            </div>
          </div>
          )}

          {/* Documents Section */}
          {activeSection === "documents" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3 className="heading mb-4" style={{ fontWeight: 700, fontSize: "1.3rem", color: "#0A400C" }}>
              Documents & Media
            </h3>
            <div className="row g-4">
              {updateResident?.documentIds && updateResident.documentIds.length > 0 ? (
                <div className="col-12">
                  <h5 className="mb-3">Uploaded Documents ({updateResident.documentIds.length})</h5>
                  <div className="list-group">
                    {updateResident.documentIds.slice(0, 5).map((doc, idx) => (
                      <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{doc.name || `Document ${idx +1}`}</strong>
                          {doc.type && <span className="ms-2 badge bg-secondary">{doc.type}</span>}
                        </div>
                        {doc.filePath && (
                          <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">View</a>
                        )}
                      </div>
                    ))}
                  </div>
                  {updateResident.documentIds.length > 5 && (
                    <p className="text-muted small mt-2">Showing 5 of {updateResident.documentIds.length} documents</p>
                  )}
                </div>
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">No documents uploaded. Add documents from the main details page.</div>
                </div>
              )}

              <div className="col-md-6">
                <h6 className="fw-bold">{`Photo Before ${getPhotoStatusContextLabel(localFormData.admissionStatus)}`}</h6>
                {localFormData.photoBeforeAdmission ? (
                  <img src={localFormData.photoBeforeAdmission} alt={`Photo Before ${getPhotoStatusContextLabel(localFormData.admissionStatus)}`} className="img-thumbnail" style={{ maxHeight: '150px' }} />
                ) : (
                  <p className="text-muted">Not uploaded</p>
                )}
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold">{`Photo After ${getPhotoStatusContextLabel(localFormData.admissionStatus)}`}</h6>
                {localFormData.photoAfterAdmission ? (
                  <img src={localFormData.photoAfterAdmission} alt={`Photo After ${getPhotoStatusContextLabel(localFormData.admissionStatus)}`} className="img-thumbnail" style={{ maxHeight: '150px' }} />
                ) : (
                  <p className="text-muted">Not uploaded</p>
                )}
              </div>

              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>Video Documentation URL</label>
                <input type="url" className="form-control" value={localFormData.videoUrl || ""} onChange={(e) => handleLocalInputChange("videoUrl", e.target.value)} onBlur={(e) => handleInputBlur("videoUrl", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button type="button" onClick={() => setActiveSection("admin")} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                ← Admin
              </button>
              <button type="button" onClick={() => setActiveSection("review")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Review & Submit →
              </button>
            </div>
          </div>
          )}

          {/* Remove old sections - start of address */}
          {false && activeSection === "address" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Address Information
            </h3>
            <div className="row g-4">
              {/* Current Address */}
              <div className="col-12">
                <h5 className="text-primary mb-3">
                  Current/Permanent Address
                </h5>
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Full Address
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.address?.fullAddress || ""}
                  onChange={(e) => handleLocalInputChange("address.fullAddress", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.fullAddress", e.target.value)}
                  placeholder="Complete address with house number, street, area, landmarks"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  City/Town
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.address?.city || ""}
                  onChange={(e) => handleLocalInputChange("address.city", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.city", e.target.value)}
                  placeholder="City or town name"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  District
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.address?.district || ""}
                  onChange={(e) => handleLocalInputChange("address.district", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.district", e.target.value)}
                  placeholder="District name"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  State
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.address?.state || ""}
                  onChange={(e) => handleLocalInputChange("address.state", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.state", e.target.value)}
                  placeholder="State name"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Country
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.address?.country || "India"}
                  onChange={(e) => handleLocalInputChange("address.country", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.country", e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  PIN Code
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.address?.pincode || ""}
                  onChange={(e) => handleLocalInputChange("address.pincode", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.pincode", e.target.value)}
                  placeholder="6-digit PIN code"
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Latitude
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.address?.latitude || ""}
                  onChange={(e) => handleLocalInputChange("address.latitude", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.latitude", e.target.value)}
                  placeholder="GPS Latitude"
                  step="0.000001"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Longitude
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.address?.longitude || ""}
                  onChange={(e) => handleLocalInputChange("address.longitude", e.target.value)}
                  onBlur={(e) => handleInputBlur("address.longitude", e.target.value)}
                  placeholder="GPS Longitude"
                  step="0.000001"
                />
              </div>

              {/* Alternative/Emergency Address */}
              <div className="col-12 mt-4">
                <h5 className="text-secondary mb-3">
                  Alternative/Emergency Address
                </h5>
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Alternative Address
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={localFormData.alternativeAddress || ""}
                  onChange={(e) => handleLocalInputChange("alternativeAddress", e.target.value)}
                  onBlur={(e) => handleInputBlur("alternativeAddress", e.target.value)}
                  placeholder="Alternative contact address (if different from permanent address)"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Nearest Landmark
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.nearestLandmark || ""}
                  onChange={(e) => handleLocalInputChange("nearestLandmark", e.target.value)}
                  onBlur={(e) => handleInputBlur("nearestLandmark", e.target.value)}
                  placeholder="Nearest landmark for easy location"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Distance from Facility (km)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.distanceFromFacility || ""}
                  onChange={(e) => handleLocalInputChange("distanceFromFacility", e.target.value)}
                  onBlur={(e) => handleInputBlur("distanceFromFacility", e.target.value)}
                  placeholder="Distance in kilometers"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("health")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Previous: Health
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("informer")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Informer →
              </button>
            </div>
          </div>
          )}

          {/* Informer Information Section */}
          {activeSection === "informer" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Informer Information
            </h3>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Informer Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.informerName || ""}
                  onChange={(e) => handleLocalInputChange("informerName", e.target.value)}
                  onBlur={(e) => handleInputBlur("informerName", e.target.value)}
                  placeholder="Name of person who provided information"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Informer Mobile
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={localFormData.informerMobile || ""}
                  onChange={(e) => handleLocalInputChange("informerMobile", e.target.value)}
                  onBlur={(e) => handleInputBlur("informerMobile", e.target.value)}
                  placeholder="Informer's mobile number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Relationship to Resident
                </label>
                <select
                  className="form-select"
                  value={localFormData.informerRelationship || ""}
                  onChange={(e) => {
                    handleLocalInputChange("informerRelationship", e.target.value);
                    handleInputBlur("informerRelationship", e.target.value);
                  }}
                >
                  <option value="">Select Relationship</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Friend">Friend</option>
                  <option value="Neighbor">Neighbor</option>
                  <option value="Social Worker">Social Worker</option>
                  <option value="Police">Police</option>
                  <option value="Hospital Staff">Hospital Staff</option>
                  <option value="Government Official">Government Official</option>
                  <option value="NGO Worker">NGO Worker</option>
                  <option value="Self">Self</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Information Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(localFormData.informationDate)}
                  onChange={(e) => handleLocalInputChange("informationDate", e.target.value)}
                  onBlur={(e) => handleInputBlur("informationDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Informer Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.informerAddress || ""}
                  onChange={(e) => handleLocalInputChange("informerAddress", e.target.value)}
                  onBlur={(e) => handleInputBlur("informerAddress", e.target.value)}
                  placeholder="Informer's address"
                />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Information Details
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.informationDetails || ""}
                  onChange={(e) => handleLocalInputChange("informationDetails", e.target.value)}
                  onBlur={(e) => handleInputBlur("informationDetails", e.target.value)}
                  placeholder="Details about how and why this information was provided"
                />
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("address")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Previous: Address
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("transport")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Transport & Admin →
              </button>
            </div>
          </div>
          )}

          {/* Transport & Organization Information Section */}
          {activeSection === "transport" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Transport & Organization Information
            </h3>
            <div className="row g-4">
              {/* Transport Details */}
              <div className="col-12">
                <h5 className="text-info mb-3">
                  Transport Details
                </h5>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Vehicle Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.conveyanceVehicleNo || ""}
                  onChange={(e) => handleLocalInputChange("conveyanceVehicleNo", e.target.value)}
                  onBlur={(e) => handleInputBlur("conveyanceVehicleNo", e.target.value)}
                  placeholder="Transport vehicle number"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Driver Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.driverName || ""}
                  onChange={(e) => handleLocalInputChange("driverName", e.target.value)}
                  onBlur={(e) => handleInputBlur("driverName", e.target.value)}
                  placeholder="Driver's full name"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Driver Mobile
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={localFormData.driverMobile || ""}
                  onChange={(e) => handleLocalInputChange("driverMobile", e.target.value)}
                  onBlur={(e) => handleInputBlur("driverMobile", e.target.value)}
                  placeholder="Driver's mobile number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Pick Up Place
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.pickUpPlace || ""}
                  onChange={(e) => handleLocalInputChange("pickUpPlace", e.target.value)}
                  onBlur={(e) => handleInputBlur("pickUpPlace", e.target.value)}
                  placeholder="Location where resident was picked up"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Pick Up Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={localFormData.pickUpTime ? new Date(localFormData.pickUpTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => handleLocalInputChange("pickUpTime", e.target.value)}
                  onBlur={(e) => handleInputBlur("pickUpTime", e.target.value)}
                />
              </div>

              {/* Organization Details */}
              <div className="col-12 mt-4">
                <h5 className="text-success mb-3">
                  Organization & Admission Details
                </h5>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Admitted By
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.admittedBy || ""}
                  onChange={(e) => handleLocalInputChange("admittedBy", e.target.value)}
                  onBlur={(e) => handleInputBlur("admittedBy", e.target.value)}
                  placeholder="Name of admitting officer"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Data Entrant Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.entrantName || ""}
                  onChange={(e) => handleLocalInputChange("entrantName", e.target.value)}
                  onBlur={(e) => handleInputBlur("entrantName", e.target.value)}
                  placeholder="Name of person who entered data"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Ward Assignment
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.ward || ""}
                  onChange={(e) => handleLocalInputChange("ward", e.target.value)}
                  onBlur={(e) => handleInputBlur("ward", e.target.value)}
                  placeholder="Ward or room assignment"
                />
              </div>

              {/* Financial & Documentation */}
              <div className="col-12 mt-4">
                <h5 className="text-warning mb-3">
                  Financial & Documentation
                </h5>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Receipt Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.receiptNo || ""}
                  onChange={(e) => handleLocalInputChange("receiptNo", e.target.value)}
                  onBlur={(e) => handleInputBlur("receiptNo", e.target.value)}
                  placeholder="Financial receipt number"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Letter Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.letterNo || ""}
                  onChange={(e) => handleLocalInputChange("letterNo", e.target.value)}
                  onBlur={(e) => handleInputBlur("letterNo", e.target.value)}
                  placeholder="Official letter number"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Item Amount (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={localFormData.itemAmount || ""}
                  onChange={(e) => handleLocalInputChange("itemAmount", e.target.value)}
                  onBlur={(e) => handleInputBlur("itemAmount", e.target.value)}
                  placeholder="Value of items/money"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-8">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Item Description
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.itemDescription || ""}
                  onChange={(e) => handleLocalInputChange("itemDescription", e.target.value)}
                  onBlur={(e) => handleInputBlur("itemDescription", e.target.value)}
                  placeholder="Detailed description of personal belongings, money, or items found with resident"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Video Documentation
                </label>
                <input
                  type="url"
                  className="form-control"
                  value={localFormData.videoUrl || ""}
                  onChange={(e) => handleLocalInputChange("videoUrl", e.target.value)}
                  onBlur={(e) => handleInputBlur("videoUrl", e.target.value)}
                  placeholder="Link to video documentation"
                />
                <small className="text-muted">Link to any video documentation of admission</small>
              </div>

              {/* Additional Organization Fields */}
              <div className="col-12 mt-4">
                <h5 className="text-secondary mb-3">
                  Additional Information
                </h5>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Organization ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.organizationId || ""}
                  onChange={(e) => handleLocalInputChange("organizationId", e.target.value)}
                  onBlur={(e) => handleInputBlur("organizationId", e.target.value)}
                  placeholder="Internal organization ID"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Admission Status
                </label>
                <select
                  className="form-select"
                  value={localFormData.admissionStatus || ""}
                  onChange={(e) => {
                    handleLocalInputChange("admissionStatus", e.target.value);
                    handleInputBlur("admissionStatus", e.target.value);
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Transferred">Transferred</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Absconded">Absconded</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Status Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(localFormData.statusDate) || ""}
                  onChange={(e) => handleLocalInputChange("statusDate", e.target.value)}
                  onBlur={(e) => handleInputBlur("statusDate", e.target.value)}
                />
                <small className="text-muted">Date when current resident status was recorded</small>
              </div>
            </div>
            {/* Section Navigation Buttons */}
            <div className="mt-4 pt-3 border-t flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("informer")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                ← Previous: Informer
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("comments")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Next: Comments →
              </button>
            </div>
          </div>
          )}

          {/* Comments Section */}
          {activeSection === "comments" && (
          <div className="p-5 rounded-3 jumbotron mt-4 shadow-sm bg-white">
            <h3
              className="heading mb-4"
              style={{
                fontWeight: 700,
                fontSize: "1.3rem",
                color: "#0A400C",
              }}
            >
              Additional Comments & Notes
            </h3>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  General Comments
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={localFormData.comments || ""}
                  onChange={(e) => handleLocalInputChange("comments", e.target.value)}
                  onBlur={(e) => handleInputBlur("comments", e.target.value)}
                  placeholder="General notes, observations, or important information about the resident..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Medical Notes
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={localFormData.medicalNotes || ""}
                  onChange={(e) => handleLocalInputChange("medicalNotes", e.target.value)}
                  onBlur={(e) => handleInputBlur("medicalNotes", e.target.value)}
                  placeholder="Specific medical observations, treatment notes, or health concerns..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Behavioral Notes
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.behavioralNotes || ""}
                  onChange={(e) => handleLocalInputChange("behavioralNotes", e.target.value)}
                  onBlur={(e) => handleInputBlur("behavioralNotes", e.target.value)}
                  placeholder="Behavioral patterns, social interactions, special needs..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Care Instructions
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={localFormData.careInstructions || ""}
                  onChange={(e) => handleLocalInputChange("careInstructions", e.target.value)}
                  onBlur={(e) => handleInputBlur("careInstructions", e.target.value)}
                  placeholder="Special care instructions, restrictions, or precautions..."
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Priority Level
                </label>
                <select
                  className="form-select"
                  value={localFormData.priorityLevel || ""}
                  onChange={(e) => {
                    handleLocalInputChange("priorityLevel", e.target.value);
                    handleInputBlur("priorityLevel", e.target.value);
                  }}
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Last Update Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(localFormData.lastUpdateDate) || new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleLocalInputChange("lastUpdateDate", e.target.value)}
                  onBlur={(e) => handleInputBlur("lastUpdateDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Updated By
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localFormData.updatedBy || ""}
                  onChange={(e) => handleLocalInputChange("updatedBy", e.target.value)}
                  onBlur={(e) => handleInputBlur("updatedBy", e.target.value)}
                  placeholder="Name of person making this update"
                />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Update Summary
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={localFormData.updateSummary || ""}
                  onChange={(e) => handleLocalInputChange("updateSummary", e.target.value)}
                  onBlur={(e) => handleInputBlur("updateSummary", e.target.value)}
                  placeholder="Brief summary of changes made in this update..."
                />
              </div>
            </div>
          </div>
          )}

          {/* Review Section */}
          {activeSection === "review" && (
            <div className="mt-4">
              <h4 className="text-lg font-bold mb-4" style={{color: "#0A400C"}}>Review & Confirm All Changes</h4>
              
              <div className="alert alert-info mb-4" role="alert">
                <strong>Please review all the information below.</strong> Click any section tab above to make changes.
              </div>

              {/* Step 1: Basic Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#0A400C"}}>
                <h5 className="text-primary mb-4 fw-bold">📋 Basic Information</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Registration No.:</strong> <span className="text-muted">{localFormData.registrationNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Admission Date:</strong> <span className="text-muted">{localFormData.admissionDate ? new Date(localFormData.admissionDate).toLocaleDateString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Full Name:</strong> <span className="text-muted">{localFormData.name || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Name by Organization:</strong> <span className="text-muted">{localFormData.nameGivenByOrganization || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Date of Birth:</strong> <span className="text-muted">{localFormData.dateOfBirth ? new Date(localFormData.dateOfBirth).toLocaleDateString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Gender:</strong> <span className="text-muted">{localFormData.gender || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Age:</strong> <span className="text-muted">{localFormData.age ? `${localFormData.age} years` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Weight:</strong> <span className="text-muted">{localFormData.weight ? `${localFormData.weight} kg` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Height:</strong> <span className="text-muted">{localFormData.height ? `${localFormData.height} cm` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Religion:</strong> <span className="text-muted">{localFormData.religion || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Identification Mark:</strong> <span className="text-muted">{localFormData.identificationMark || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Category:</strong> <span className="text-muted">{localFormData.category || "N/A"}</span></div>
                </div>
              </div>

              {/* Step 2: Contact & Address Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
                <h5 className="text-primary mb-4 fw-bold">📞 Contact & Address Information</h5>
                <div className="row g-3">
                  <div className="col-12"><strong>Full Address:</strong> <span className="text-muted">{localFormData.address?.fullAddress || "N/A"}</span></div>
                  <div className="col-md-6"><strong>City:</strong> <span className="text-muted">{localFormData.address?.city || "N/A"}</span></div>
                  <div className="col-md-6"><strong>District:</strong> <span className="text-muted">{localFormData.address?.district || "N/A"}</span></div>
                  <div className="col-md-6"><strong>State:</strong> <span className="text-muted">{localFormData.address?.state || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Country:</strong> <span className="text-muted">{localFormData.address?.country || "N/A"}</span></div>
                  <div className="col-md-6"><strong>PIN Code:</strong> <span className="text-muted">{localFormData.address?.pincode || "N/A"}</span></div>
                  <div className="col-12"><strong>Alternative Address:</strong> <span className="text-muted">{localFormData.alternativeAddress || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Latitude:</strong> <span className="text-muted">{localFormData.address?.latitude || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Longitude:</strong> <span className="text-muted">{localFormData.address?.longitude || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Mobile Number:</strong> <span className="text-muted">{localFormData.mobileNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Phone Number:</strong> <span className="text-muted">{localFormData.phoneNumber || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Alternative Contact:</strong> <span className="text-muted">{localFormData.alternativeContact || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Email Address:</strong> <span className="text-muted">{localFormData.emailAddress || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Social Media Handle:</strong> <span className="text-muted">{localFormData.socialMediaHandle || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Voter ID:</strong> <span className="text-muted">{localFormData.voterId || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Aadhaar Number:</strong> <span className="text-muted">{localFormData.aadhaarNumber || "N/A"}</span></div>
                </div>
              </div>

              {/* Guardian & Emergency Contact */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
                <h5 className="text-primary mb-4 fw-bold">👥 Guardian & Emergency Contact</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Guardian Name:</strong> <span className="text-muted">{localFormData.guardianName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Relative Who Admitted:</strong> <span className="text-muted">{localFormData.relativeAdmit || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Relationship with Resident:</strong> <span className="text-muted">{localFormData.relationWith || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Name:</strong> <span className="text-muted">{localFormData.emergencyContactName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Number:</strong> <span className="text-muted">{localFormData.emergencyContactNumber || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Relationship:</strong> <span className="text-muted">{localFormData.emergencyContactRelationship || "N/A"}</span></div>
                </div>
              </div>

              {/* Step 3: Health Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#dc2626"}}>
                <h5 className="text-primary mb-4 fw-bold">🏥 Health Information</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Health Status:</strong>
                      <span className={`ms-2 badge ${getHealthStatusDisplayValue(localFormData.healthStatus).toLowerCase().includes("good") ? "bg-success" : getHealthStatusDisplayValue(localFormData.healthStatus).toLowerCase().includes("critical") ? "bg-danger" : getHealthStatusDisplayValue(localFormData.healthStatus) === "N/A" ? "bg-secondary" : "bg-warning"}`}>
                        {getHealthStatusDisplayValue(localFormData.healthStatus)}
                    </span>
                  </div>
                  <div className="col-md-6"><strong>Blood Group:</strong> <span className="text-muted">{localFormData.bloodGroup || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Body Temperature:</strong> <span className="text-muted">{localFormData.bodyTemperature ? `${localFormData.bodyTemperature}°C` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Heart Rate:</strong> <span className="text-muted">{localFormData.heartRate ? `${localFormData.heartRate} BPM` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Respiratory Rate:</strong> <span className="text-muted">{localFormData.respiratoryRate ? `${localFormData.respiratoryRate}/min` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Blood Pressure:</strong> <span className="text-muted">{localFormData.bloodPressure || "N/A"}</span></div>
                  <div className="col-12"><strong>Allergies:</strong> <span className="text-muted">{localFormData.allergies || "N/A"}</span></div>
                  <div className="col-12"><strong>Other Known Allergies:</strong> <span className="text-muted">{localFormData.knownAllergies || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical Conditions:</strong> <span className="text-muted">{localFormData.medicalConditions || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Disability Status:</strong> <span className="text-muted">{localFormData.disabilityStatus || "N/A"}</span></div>
                  <div className="col-12"><strong>Disability Details:</strong> <span className="text-muted">{localFormData.disabilityDetails || "N/A"}</span></div>
                  <div className="col-12"><strong>Current Medications:</strong> <span className="text-muted">{localFormData.medications || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Rehabilitation Status:</strong> <span className="text-muted">{localFormData.rehabStatus || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Primary Doctor:</strong> <span className="text-muted">{localFormData.primaryDoctor || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Preferred Hospital:</strong> <span className="text-muted">{localFormData.preferredHospital || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical History Notes:</strong> <span className="text-muted">{localFormData.medicalHistory || "N/A"}</span></div>
                </div>
              </div>

              {/* Transport & Organization */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#16a34a"}}>
                <h5 className="text-primary mb-4 fw-bold">🚗 Transport & Organization</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Vehicle No.:</strong> <span className="text-muted">{localFormData.conveyanceVehicleNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Pick Up Place:</strong> <span className="text-muted">{localFormData.pickUpPlace || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Pick Up Time:</strong> <span className="text-muted">{localFormData.pickUpTime ? new Date(localFormData.pickUpTime).toLocaleString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Entrant Name:</strong> <span className="text-muted">{localFormData.entrantName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Driver Name:</strong> <span className="text-muted">{localFormData.driverName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Driver Mobile:</strong> <span className="text-muted">{localFormData.driverMobile || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Admitted By:</strong> <span className="text-muted">{localFormData.admittedBy || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Ward:</strong> <span className="text-muted">{localFormData.ward || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Organization ID:</strong> <span className="text-muted">{localFormData.organizationId || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Admission Status:</strong> <span className="text-muted">{localFormData.admissionStatus || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Status Date:</strong> <span className="text-muted">{localFormData.statusDate ? new Date(localFormData.statusDate).toLocaleDateString() : "N/A"}</span></div>
                </div>
              </div>

              {/* Financial & Documentation */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
                <h5 className="text-primary mb-4 fw-bold">💰 Financial & Documentation</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Receipt No.:</strong> <span className="text-muted">{localFormData.receiptNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Letter No.:</strong> <span className="text-muted">{localFormData.letterNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Item Amount (₹):</strong> <span className="text-muted">{localFormData.itemAmount || "N/A"}</span></div>
                  <div className="col-12"><strong>Item Description:</strong> <span className="text-muted">{localFormData.itemDescription || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Video URL:</strong> <span className="text-muted">{localFormData.videoUrl ? <a href={localFormData.videoUrl} target="_blank" rel="noopener noreferrer">{localFormData.videoUrl}</a> : "N/A"}</span></div>
                </div>
              </div>

              {/* Comments & Notes */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
                <h5 className="text-primary mb-4 fw-bold">📝 Comments & Notes</h5>
                <div className="row g-3">
                  <div className="col-12"><strong>General Comments:</strong> <span className="text-muted">{localFormData.comments || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical Notes:</strong> <span className="text-muted">{localFormData.medicalNotes || "N/A"}</span></div>
                  <div className="col-12"><strong>Behavioral Notes:</strong> <span className="text-muted">{localFormData.behavioralNotes || "N/A"}</span></div>
                  <div className="col-12"><strong>Care Instructions:</strong> <span className="text-muted">{localFormData.careInstructions || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Priority Level:</strong> <span className="text-muted">{localFormData.priorityLevel || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Updated By:</strong> <span className="text-muted">{localFormData.updatedBy || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Last Update Date:</strong> <span className="text-muted">{localFormData.lastUpdateDate ? new Date(localFormData.lastUpdateDate).toLocaleDateString() : "N/A"}</span></div>
                </div>
              </div>

              {/* Navigation Button */}
              <div className="mt-4 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveSection("documents")}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  ← Back to Documents
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-sm text-gray-600">
              {changedFields.size > 0 ? (
                <span className="text-blue-600">
                  {changedFields.size} field{changedFields.size > 1 ? "s" : ""} will be updated
                </span>
              ) : (
                <span>No changes detected</span>
              )}
            </div>
            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={closeUpdateModal}
                className="btn btn-secondary px-4"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateResidentData}
                disabled={updateLoading || changedFields.size === 0}
                className={`btn px-4 ${changedFields.size === 0 ? 'btn-outline-secondary' : ''}`}
                style={changedFields.size > 0 ? {
                  backgroundColor: "#0A400C",
                  color: "white",
                  fontWeight: 600,
                } : {}}
              >
                {updateLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit size={16} className="me-2" />
                    {changedFields.size > 0 ? `Update ${changedFields.size} Field${changedFields.size > 1 ? "s" : ""}` : "No Changes to Save"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Resident Details Modal Component - SHOWS ALL FIELDS WITH N/A FOR EMPTY
  const ResidentDetailsModal = () => {
    if (!selectedResident) return null;

    const formatDate = (dateString) => {
      return dateString ? new Date(dateString).toLocaleDateString("en-IN") : "N/A";
    };

    const formatAddress = (address) => {
      if (!address) return "N/A";
      const parts = [];
      if (address.fullAddress) parts.push(address.fullAddress);
      if (address.city) parts.push(address.city);
      if (address.district) parts.push(address.district);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      if (address.pincode) parts.push(`PIN: ${address.pincode}`);
      return parts.join(", ") || "N/A";
    };

    // Handle image loading errors
    const handleImageError = (e) => {
      console.error("Failed to load image:", e.target.src);
      e.target.style.display = "none";
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto mt-5">
          <div className="sticky top-0 bg-white p-6 border-b shadow-sm z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedResident.nameGivenByOrganization ||
                    selectedResident.name ||
                    "N/A"}
                </h2>
                <p className="text-gray-600 mt-1">
                  Registration No: {selectedResident.registrationNo || "N/A"}
                </p>
                {selectedResident.admissionStatus && (
                  <p className="mt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResidentStatusBadgeClass(
                        selectedResident.admissionStatus
                      )}`}
                    >
                      {selectedResident.admissionStatus}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Admission Date: {formatDate(selectedResident.admissionDate)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status Date: {formatDate(selectedResident.statusDate)}
                </p>
              </div>

              {/* Photos & Action buttons */}
              <div className="flex items-start space-x-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      downloadResidentDetails(
                        selectedResident._id,
                        selectedResident.registrationNo,
                        selectedResident.nameGivenByOrganization ||
                        selectedResident.name
                      )
                    }
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    title="Download Details"
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </button>
                </div>

                {/* Photo Before Status */}
                {selectedResident.photoBeforeAdmission ? (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center mb-1">{`Before ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}</p>
                    <img
                      src={selectedResident.photoBeforeAdmission}
                      alt={`Before ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}
                      className="w-20 h-20 object-cover rounded-lg shadow-lg border-2 border-gray-200"
                      onError={handleImageError}
                      onLoad={(e) => (e.target.style.display = "block")}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center mb-1">{`Before ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}</p>
                    <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg shadow-lg border-2 border-gray-200">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  </div>
                )}

                {/* Photo After Status */}
                {selectedResident.photoAfterAdmission ? (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center mb-1">{`After ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}</p>
                    <img
                      src={selectedResident.photoAfterAdmission}
                      alt={`After ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}
                      className="w-20 h-20 object-cover rounded-lg shadow-lg border-2 border-gray-200"
                      onError={handleImageError}
                      onLoad={(e) => (e.target.style.display = "block")}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center mb-1">{`After ${getPhotoStatusContextLabel(selectedResident.admissionStatus)}`}</p>
                    <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg shadow-lg border-2 border-gray-200">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  </div>
                )}

                {/* Legacy Photo (if no before/after photos) */}
                {!selectedResident.photoBeforeAdmission && !selectedResident.photoAfterAdmission && selectedResident.photoUrl && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 text-center mb-1">Photo</p>
                    <img
                      src={selectedResident.photoUrl}
                      alt="Resident"
                      className="w-20 h-20 object-cover rounded-lg shadow-lg border-2 border-gray-200"
                      onError={handleImageError}
                      onLoad={(e) => (e.target.style.display = "block")}
                    />
                  </div>
                )}

                <button
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-4"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Basic Information */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#0A400C"}}>
              <h5 className="text-primary mb-4 fw-bold">📋 Basic Information</h5>
              <div className="row g-3">
                <div className="col-md-6"><strong>Registration No.:</strong> <span className="text-muted">{selectedResident.registrationNo || "N/A"}</span></div>
                <div className="col-md-6"><strong>Admission Date:</strong> <span className="text-muted">{formatDate(selectedResident.admissionDate)}</span></div>
                <div className="col-md-6"><strong>Full Name:</strong> <span className="text-muted">{selectedResident.name || "N/A"}</span></div>
                <div className="col-md-6"><strong>Name by Organization:</strong> <span className="text-muted">{selectedResident.nameGivenByOrganization || "N/A"}</span></div>
                <div className="col-md-6"><strong>Date of Birth:</strong> <span className="text-muted">{formatDate(selectedResident.dateOfBirth)}</span></div>
                <div className="col-md-6"><strong>Gender:</strong> <span className="text-muted">{selectedResident.gender || "N/A"}</span></div>
                <div className="col-md-6"><strong>Age:</strong> <span className="text-muted">{selectedResident.age ? `${selectedResident.age} years` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Weight:</strong> <span className="text-muted">{selectedResident.weight ? `${selectedResident.weight} kg` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Height:</strong> <span className="text-muted">{selectedResident.height ? `${selectedResident.height} cm` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Religion:</strong> <span className="text-muted">{selectedResident.religion || "N/A"}</span></div>
                <div className="col-md-6"><strong>Identification Mark:</strong> <span className="text-muted">{selectedResident.identificationMark || "N/A"}</span></div>
                <div className="col-md-6"><strong>Category:</strong> <span className="text-muted">{selectedResident.category || "N/A"}</span></div>
              </div>
            </div>

            {/* Step 2: Contact & Address Information */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
              <h5 className="text-primary mb-4 fw-bold">📞 Contact & Address Information</h5>
              <div className="row g-3">
                <div className="col-12"><strong>Full Address:</strong> <span className="text-muted">{selectedResident.address?.fullAddress || "N/A"}</span></div>
                <div className="col-md-6"><strong>City:</strong> <span className="text-muted">{selectedResident.address?.city || "N/A"}</span></div>
                <div className="col-md-6"><strong>District:</strong> <span className="text-muted">{selectedResident.address?.district || "N/A"}</span></div>
                <div className="col-md-6"><strong>State:</strong> <span className="text-muted">{selectedResident.address?.state || "N/A"}</span></div>
                <div className="col-md-6"><strong>Country:</strong> <span className="text-muted">{selectedResident.address?.country || "N/A"}</span></div>
                <div className="col-md-6"><strong>PIN Code:</strong> <span className="text-muted">{selectedResident.address?.pincode || "N/A"}</span></div>
                <div className="col-12"><strong>Alternative Address:</strong> <span className="text-muted">{selectedResident.alternativeAddress || "N/A"}</span></div>
                <div className="col-md-6"><strong>Nearest Landmark:</strong> <span className="text-muted">{selectedResident.nearestLandmark || "N/A"}</span></div>
                <div className="col-md-6"><strong>Distance from Facility (km):</strong> <span className="text-muted">{selectedResident.distanceFromFacility || "N/A"}</span></div>
                <div className="col-md-6"><strong>Latitude:</strong> <span className="text-muted">{selectedResident.address?.latitude || "N/A"}</span></div>
                <div className="col-md-6"><strong>Longitude:</strong> <span className="text-muted">{selectedResident.address?.longitude || "N/A"}</span></div>
                <div className="col-md-6"><strong>Mobile Number:</strong> <span className="text-muted">{selectedResident.mobileNo || "N/A"}</span></div>
                <div className="col-md-6"><strong>Phone Number:</strong> <span className="text-muted">{selectedResident.phoneNumber || "N/A"}</span></div>
                <div className="col-md-6"><strong>Alternative Contact:</strong> <span className="text-muted">{selectedResident.alternativeContact || "N/A"}</span></div>
                <div className="col-md-6"><strong>Email Address:</strong> <span className="text-muted">{selectedResident.emailAddress || "N/A"}</span></div>
                <div className="col-md-6"><strong>Social Media Handle:</strong> <span className="text-muted">{selectedResident.socialMediaHandle || "N/A"}</span></div>
                <div className="col-md-6"><strong>Voter ID:</strong> <span className="text-muted">{selectedResident.voterId || "N/A"}</span></div>
                <div className="col-md-6"><strong>Aadhaar Number:</strong> <span className="text-muted">{selectedResident.aadhaarNumber || "N/A"}</span></div>
              </div>
            </div>

            {/* Guardian & Emergency Contact */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
              <h5 className="text-primary mb-4 fw-bold">👥 Guardian & Emergency Contact</h5>
              <div className="row g-3">
                <div className="col-md-6"><strong>Guardian Name:</strong> <span className="text-muted">{selectedResident.guardianName || "N/A"}</span></div>
                <div className="col-md-6"><strong>Relative Who Admitted:</strong> <span className="text-muted">{selectedResident.relativeAdmit || "N/A"}</span></div>
                <div className="col-md-6"><strong>Relationship with Resident:</strong> <span className="text-muted">{selectedResident.relationWith || "N/A"}</span></div>
                <div className="col-md-6"><strong>Emergency Contact Name:</strong> <span className="text-muted">{selectedResident.emergencyContactName || "N/A"}</span></div>
                <div className="col-md-6"><strong>Emergency Contact Number:</strong> <span className="text-muted">{selectedResident.emergencyContactNumber || "N/A"}</span></div>
                <div className="col-md-6"><strong>Emergency Contact Relationship:</strong> <span className="text-muted">{selectedResident.emergencyContactRelationship || "N/A"}</span></div>
              </div>
            </div>

            {/* Step 3: Health Information */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#dc2626"}}>
              <h5 className="text-primary mb-4 fw-bold">🏥 Health Information</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <strong>Health Status:</strong>
                  <span className={`ms-2 badge ${getHealthStatusDisplayValue(selectedResident.healthStatus).toLowerCase().includes("good") ? "bg-success" : getHealthStatusDisplayValue(selectedResident.healthStatus).toLowerCase().includes("critical") ? "bg-danger" : getHealthStatusDisplayValue(selectedResident.healthStatus) === "N/A" ? "bg-secondary" : "bg-warning"}`}>
                    {getHealthStatusDisplayValue(selectedResident.healthStatus)}
                  </span>
                </div>
                <div className="col-md-6"><strong>Blood Group:</strong> <span className="text-muted">{selectedResident.bloodGroup || "N/A"}</span></div>
                <div className="col-md-6"><strong>Body Temperature:</strong> <span className="text-muted">{selectedResident.bodyTemperature ? `${selectedResident.bodyTemperature}°C` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Heart Rate:</strong> <span className="text-muted">{selectedResident.heartRate ? `${selectedResident.heartRate} BPM` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Respiratory Rate:</strong> <span className="text-muted">{selectedResident.respiratoryRate ? `${selectedResident.respiratoryRate}/min` : "N/A"}</span></div>
                <div className="col-md-6"><strong>Blood Pressure:</strong> <span className="text-muted">{selectedResident.bloodPressure || "N/A"}</span></div>
                <div className="col-12"><strong>Allergies:</strong> <span className="text-muted">{selectedResident.allergies || "N/A"}</span></div>
                <div className="col-12"><strong>Other Known Allergies:</strong> <span className="text-muted">{selectedResident.knownAllergies || "N/A"}</span></div>
                <div className="col-12"><strong>Medical Conditions:</strong> <span className="text-muted">{selectedResident.medicalConditions || "N/A"}</span></div>
                <div className="col-md-6"><strong>Disability Status:</strong> <span className="text-muted">{selectedResident.disabilityStatus || "N/A"}</span></div>
                <div className="col-12"><strong>Disability Details:</strong> <span className="text-muted">{selectedResident.disabilityDetails || "N/A"}</span></div>
                <div className="col-12"><strong>Current Medications:</strong> <span className="text-muted">{selectedResident.medications || "N/A"}</span></div>
                <div className="col-md-6"><strong>Rehabilitation Status:</strong> <span className="text-muted">{selectedResident.rehabStatus || "N/A"}</span></div>
                <div className="col-md-6"><strong>Primary Doctor:</strong> <span className="text-muted">{selectedResident.primaryDoctor || "N/A"}</span></div>
                <div className="col-md-6"><strong>Preferred Hospital:</strong> <span className="text-muted">{selectedResident.preferredHospital || "N/A"}</span></div>
                <div className="col-12"><strong>Medical History Notes:</strong> <span className="text-muted">{selectedResident.medicalHistoryNotes || "N/A"}</span></div>
                <div className="col-12"><strong>Medical History:</strong> <span className="text-muted">{selectedResident.medicalHistory || "N/A"}</span></div>
              </div>
            </div>

            {/* Informer Information */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#ea580c"}}>
              <h5 className="text-primary mb-4 fw-bold">ℹ️ Informer Information</h5>
              <div className="row g-3">
                <div className="col-md-6"><strong>Informer Name:</strong> <span className="text-muted">{selectedResident.informerName || "N/A"}</span></div>
                <div className="col-md-6"><strong>Informer Mobile:</strong> <span className="text-muted">{selectedResident.informerMobile || "N/A"}</span></div>
                <div className="col-md-6"><strong>Informer Relationship:</strong> <span className="text-muted">{selectedResident.informerRelationship || "N/A"}</span></div>
                <div className="col-md-6"><strong>Information Date:</strong> <span className="text-muted">{formatDate(selectedResident.informationDate)}</span></div>
                <div className="col-12"><strong>Informer Address:</strong> <span className="text-muted">{selectedResident.informerAddress || "N/A"}</span></div>
                <div className="col-12"><strong>Information Details:</strong> <span className="text-muted">{selectedResident.informationDetails || "N/A"}</span></div>
              </div>
            </div>

            {/* Step 4: Transport & Organization */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#16a34a"}}>
              <h5 className="text-primary mb-4 fw-bold">🚗 Transport & Organization</h5>
              <div className="row g-3">
                <div className="col-md-6"><strong>Vehicle No.:</strong> <span className="text-muted">{selectedResident.conveyanceVehicleNo || "N/A"}</span></div>
                <div className="col-md-6"><strong>Pick Up Place:</strong> <span className="text-muted">{selectedResident.pickUpPlace || "N/A"}</span></div>
                <div className="col-md-6"><strong>Pick Up Time:</strong> <span className="text-muted">{selectedResident.pickUpTime ? new Date(selectedResident.pickUpTime).toLocaleString() : "N/A"}</span></div>
                <div className="col-md-6"><strong>Transport Time:</strong> <span className="text-muted">{selectedResident.transportTime ? new Date(selectedResident.transportTime).toLocaleString() : "N/A"}</span></div>
                <div className="col-md-6"><strong>Entrant Name:</strong> <span className="text-muted">{selectedResident.entrantName || "N/A"}</span></div>
                <div className="col-md-6"><strong>Driver Name:</strong> <span className="text-muted">{selectedResident.driverName || "N/A"}</span></div>
                <div className="col-md-6"><strong>Driver Mobile:</strong> <span className="text-muted">{selectedResident.driverMobile || "N/A"}</span></div>
                <div className="col-12"><strong>Transport Notes:</strong> <span className="text-muted">{selectedResident.transportNotes || "N/A"}</span></div>
                <div className="col-md-6"><strong>Admitted By:</strong> <span className="text-muted">{selectedResident.admittedBy || "N/A"}</span></div>
                <div className="col-md-6"><strong>Ward:</strong> <span className="text-muted">{selectedResident.ward || "N/A"}</span></div>
                <div className="col-md-6"><strong>Organization ID:</strong> <span className="text-muted">{selectedResident.organizationId || "N/A"}</span></div>
                <div className="col-md-6"><strong>Admission Status:</strong> <span className="text-muted">{selectedResident.admissionStatus || "N/A"}</span></div>
                <div className="col-md-6"><strong>Status Date:</strong> <span className="text-muted">{formatDate(selectedResident.statusDate)}</span></div>
              </div>
            </div>

            {/* Financial & Documentation */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
              <h5 className="text-primary mb-4 fw-bold">💰 Financial & Documentation</h5>
              <div className="row g-3">
                <div className="col-md-6"><strong>Receipt No.:</strong> <span className="text-muted">{selectedResident.receiptNo || "N/A"}</span></div>
                <div className="col-md-6"><strong>Letter No.:</strong> <span className="text-muted">{selectedResident.letterNo || "N/A"}</span></div>
                <div className="col-md-6"><strong>Item Amount (₹):</strong> <span className="text-muted">{selectedResident.itemAmount || "N/A"}</span></div>
                <div className="col-12"><strong>Item Description:</strong> <span className="text-muted">{selectedResident.itemDescription || "N/A"}</span></div>
                <div className="col-md-6"><strong>Video URL:</strong> <span className="text-muted">{selectedResident.videoUrl ? <a href={selectedResident.videoUrl} target="_blank" rel="noopener noreferrer">{selectedResident.videoUrl}</a> : "N/A"}</span></div>
              </div>
            </div>

            {/* Comments & Notes */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
              <h5 className="text-primary mb-4 fw-bold">📝 Comments & Notes</h5>
              <div className="row g-3">
                <div className="col-12"><strong>General Comments:</strong> <span className="text-muted">{selectedResident.comments || "N/A"}</span></div>
                <div className="col-12"><strong>Additional Comments:</strong> <span className="text-muted">{selectedResident.generalComments || "N/A"}</span></div>
                <div className="col-12"><strong>Medical Notes:</strong> <span className="text-muted">{selectedResident.medicalNotes || "N/A"}</span></div>
                <div className="col-12"><strong>Behavioral Notes:</strong> <span className="text-muted">{selectedResident.behavioralNotes || "N/A"}</span></div>
                <div className="col-12"><strong>Care Instructions:</strong> <span className="text-muted">{selectedResident.careInstructions || "N/A"}</span></div>
                <div className="col-md-6"><strong>Priority Level:</strong> <span className="text-muted">{selectedResident.priorityLevel || "N/A"}</span></div>
                <div className="col-md-6"><strong>Updated By:</strong> <span className="text-muted">{selectedResident.updatedBy || "N/A"}</span></div>
                <div className="col-md-6"><strong>Last Update Date:</strong> <span className="text-muted">{formatDate(selectedResident.lastUpdateDate)}</span></div>
                <div className="col-12"><strong>Update Summary:</strong> <span className="text-muted">{selectedResident.updateSummary || "N/A"}</span></div>
              </div>
            </div>

            {/* Documents */}
            <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#059669"}}>
              <h5 className="text-primary mb-4 fw-bold">📄 Documents</h5>
              {selectedResident.documentIds && selectedResident.documentIds.length > 0 ? (
                <ul className="list-disc pl-5">
                  {selectedResident.documentIds.map((doc) => (
                    <li key={doc._id} className="text-sm text-gray-900">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.name} ({doc.type})
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No documents uploaded</p>
              )}
            </div>

            {/* Care Events (if any) */}
            {selectedResident.careEvents && selectedResident.careEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-pink-800 border-b pb-2">
                  Care Events History (Latest 5)
                </h3>
                <div className="space-y-4">
                  {selectedResident.careEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-50 rounded-r">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <strong className="text-blue-700">{event.type}</strong>
                          <span className="ml-2 text-sm text-gray-600">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        {event.status && (
                          <span className={`px-2 py-1 rounded text-xs ${event.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {event.status}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-700">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // PDF Preview Modal Component
  const PDFPreviewModal = () => {
    if (!isPreviewOpen || !previewUrl) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  PDF Preview
                </h3>
                {previewResident && (
                  <p className="text-green-100 text-sm">
                    {previewResident.name} - {previewResident.registrationNo}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (previewResident) {
                    downloadResidentDetails(
                      previewUrl.split("/")[5],
                      previewResident.registrationNo,
                      previewResident.name
                    );
                  }
                }}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center space-x-1"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  if (previewResident) {
                    printResidentDetails(
                      previewUrl.split("/")[5],
                      previewResident.registrationNo,
                      previewResident.name
                    );
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>
              <button
                onClick={closePreview}
                className="text-white hover:text-green-200 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 p-4 bg-gray-100">
            <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
                onError={() => setError("Failed to load PDF preview")}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              This is a preview. Download the full PDF for complete details.
            </div>
            <div className="flex space-x-2">
              <button
                onClick={closePreview}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  if (previewResident) {
                    downloadResidentDetails(
                      previewUrl.split("/")[5],
                      previewResident.registrationNo,
                      previewResident.name
                    );
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  if (previewResident) {
                    printResidentDetails(
                      previewUrl.split("/")[5],
                      previewResident.registrationNo,
                      previewResident.name
                    );
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 min-h-screen mt-5" style={{ background: "#FEFCF2" }}>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: "#0A400C" }}
        >
          <Users className="inline-block mr-3 " size={32} />
          Residents Directory
        </h1>
        <p className="text-gray-600 text-center">
          Manage and view all registered residents
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, registration no, or location..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Filter size={14} />
              Filters
              <ChevronDown
                size={14}
                className={`transform transition-transform ${showFilters ? "rotate-180" : ""
                  }`}
              />
            </button>
            <button
              onClick={exportToExcel}
              disabled={exportLoading}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <Download size={14} />
              {exportLoading ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Health Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Status
                </label>
                <select
                  value={filters.healthStatus}
                  onChange={(e) =>
                    handleFilterChange("healthStatus", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Critical">Critical</option>
                  <option value="Stable">Stable</option>
                </select>
              </div>

              {/* Resident Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resident Status
                </label>
                <select
                  value={filters.admissionStatus}
                  onChange={(e) =>
                    handleFilterChange("admissionStatus", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Resident Status</option>
                  <option value="Admission">Admission</option>
                  <option value="Discharge">Discharge</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Death">Death</option>
                  <option value="Discharge/Transfer">Discharge/Transfer</option>
                  <option value="Body Donation">Body Donation</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Routine">Routine</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) =>
                    handleFilterChange("bloodGroup", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Age Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageRange.min}
                    onChange={(e) =>
                      handleFilterChange("ageRange", {
                        ...filters.ageRange,
                        min: e.target.value,
                      })
                    }
                    className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageRange.max}
                    onChange={(e) =>
                      handleFilterChange("ageRange", {
                        ...filters.ageRange,
                        max: e.target.value,
                      })
                    }
                    className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Admission Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.admissionDateRange.start}
                    onChange={(e) =>
                      handleFilterChange("admissionDateRange", {
                        ...filters.admissionDateRange,
                        start: e.target.value,
                      })
                    }
                    className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.admissionDateRange.end}
                    onChange={(e) =>
                      handleFilterChange("admissionDateRange", {
                        ...filters.admissionDateRange,
                        end: e.target.value,
                      })
                    }
                    className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Disability Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disability Status
                </label>
                <input
                  type="text"
                  placeholder="Enter disability status"
                  value={filters.disabilityStatus}
                  onChange={(e) =>
                    handleFilterChange("disabilityStatus", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading residents...</p>
        </div>
      )}

      {/* Residents Table */}
      {!loading && residents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("registrationNo")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Registration No</span>
                      {sortField === "registrationNo" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortField === "name" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("admissionDate")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortField === "admissionDate" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("age")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Age</span>
                      {sortField === "age" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("gender")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Gender</span>
                      {sortField === "gender" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("healthStatus")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Health Status</span>
                      {sortField === "healthStatus" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {residents.map((resident) => (
                  <tr key={resident._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {resident.registrationNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(resident)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {resident.name ||
                            resident.nameGivenByOrganization ||
                            "N/A"}
                        </button>
                        {resident.admissionStatus && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResidentStatusBadgeClass(
                              resident.admissionStatus
                            )}`}
                          >
                            {resident.admissionStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resident.admissionDate
                        ? new Date(resident.admissionDate).toLocaleDateString()
                        : resident.date || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resident.age || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resident.gender || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusBadgeClass(resident)}`}
                      >
                        {getDisplayedHealthStatus(resident)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-8">
                        <button
                          onClick={() => handleViewDetails(resident)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </button>
                        <Link
                          to={`/register?update=${resident._id}`}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Update
                        </Link>
                        {userRole === "superadmin" && (
                          <button
                            onClick={() => handleDeleteClick(resident)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            disabled={deleteLoading === resident._id}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && residents.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No residents found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or add new residents.
          </p>
        </div>
      )}

      {/* Resident Details Modal */}
      {showDetails && <ResidentDetailsModal />}

      {/* Update Resident Modal */}
      {showUpdateModal && <UpdateResidentModal />}

      {/* PDF Preview Modal */}
      <PDFPreviewModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null })}
        type="info"
      />
    </div>
  );
};

export default ResidentsListing;

