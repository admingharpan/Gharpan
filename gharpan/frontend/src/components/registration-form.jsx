import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FormField from "./FormField";
import FormSteps from "./FormSteps";
import { useToast, ToastContainer } from "./Toast";
import {
  validateForm,
  validateField,
  registrationFormRules,
  normalizePhoneNumber,
  saveFormDraft,
  loadFormDraft,
  clearFormDraft,
} from "../utils/validation";

function RegistrationForm() {
  const [animate, setAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [searchParams] = useSearchParams();
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [residentId, setResidentId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } =
    useToast();

  // Form steps configuration
  const formSteps = [
    { id: "basic", label: "Basic Info" },
    { id: "contact", label: "Contact" },
    { id: "health", label: "Health" },
    { id: "admin", label: "Admin" },
    { id: "documents", label: "Documents" },
    { id: "review", label: "Review & Submit" },
  ];

  // Form data state with proper photo field handling
  const [formData, setFormData] = useState({
    registrationNo: "",
    admissionDate: "",
    name: "",
    nameGivenByOrganization: "",
    dateOfBirth: "",
    gender: "",
    age: "",
    weight: "",
    height: "",
    religion: "",
    identificationMark: "",
    state: "",
    district: "",
    country: "India",
    fullAddress: "",
    city: "",
    pincode: "",
    latitude: "",
    longitude: "",
    alternativeAddress: "",
    nearestLandmark: "",
    distanceFromFacility: "",
    relativeAdmit: "",
    relationWith: "",
    guardianName: "",
    mobileNo: "",
    phoneNumber: "",
    alternativeContact: "",
    emailAddress: "",
    socialMediaHandle: "",
    voterId: "",
    aadhaarNumber: "",
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactNumber: "",
    emergencyContactRelationship: "",
    // Health Information
    healthStatus: "",
    category: "",
    bloodGroup: "",
    allergies: "",
    knownAllergies: "",
    medicalConditions: "",
    disabilityStatus: "",
    disabilityDetails: "",
    medications: "",
    rehabStatus: "",
    // Vital Signs
    bodyTemperature: "",
    heartRate: "",
    respiratoryRate: "",
    bloodPressure: "",
    // Additional Health
    primaryDoctor: "",
    preferredHospital: "",
    medicalHistoryNotes: "",
    medicalHistory: "",
    // Comments
    comments: "",
    generalComments: "",
    medicalNotes: "",
    behavioralNotes: "",
    careInstructions: "",
    priorityLevel: "",
    updateSummary: "",
    updatedBy: "",
    lastUpdateDate: "",
    // Informer Information
    informerName: "",
    informerMobile: "",
    informerRelationship: "",
    informationDate: "",
    informerAddress: "",
    informationDetails: "",
    // Transport Information
    conveyanceVehicleNo: "",
    pickUpPlace: "",
    pickUpTime: "",
    entrantName: "",
    driverName: "",
    driverMobile: "",
    transportTime: "",
    transportNotes: "",
    admittedBy: "",
    organizationId: "",
    admissionStatus: "Admission",
    statusDate: "",
    ward: "",
    receiptNo: "",
    letterNo: "",
    itemDescription: "",
    itemAmount: "",
    videoUrl: "",
    // Photo fields
    photoBeforeAdmission: null,
    photoAfterAdmission: null,
    photo: null, // Keep for backward compatibility
    documents: [],
    confirmDetails: false,
  });

  useEffect(() => {
    setAnimate(true);

    // Check if we're in update mode
    const updateId = searchParams.get("update");
    if (updateId) {
      setIsUpdateMode(true);
      setResidentId(updateId);
      fetchResidentData(updateId);
    } else {
      // Load draft if available (only for new registrations)
      const draft = loadFormDraft();
      if (draft && !isDraftLoaded) {
        setFormData((prevData) => ({
          ...prevData,
          ...draft,
          documents: draft.documents || [],
        }));
        setIsDraftLoaded(true);
        setLastSaved(draft.lastSaved);
        showInfo(
          "Previous draft loaded. You can continue where you left off.",
          6000
        );
      }
    }
  }, [searchParams, isDraftLoaded]);

  // Fetch resident data for update with all fields
  const fetchResidentData = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/residents/${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        const residentData = result.data;
        
        // Populate form with all existing data including photos
        setFormData((prevData) => ({
          ...prevData,
          // Basic Information
          registrationNo: residentData.registrationNo || "",
          admissionDate: residentData.admissionDate ? residentData.admissionDate.split('T')[0] : "",
          name: residentData.name || "",
          nameGivenByOrganization: residentData.nameGivenByOrganization || "",
          dateOfBirth: residentData.dateOfBirth ? residentData.dateOfBirth.split('T')[0] : "",
          gender: residentData.gender || "",
          age: residentData.age || "",
          weight: residentData.weight || "",
          height: residentData.height || "",
          religion: residentData.religion || "",
          identificationMark: residentData.identificationMark || "",
          
          // Address Information
          state: residentData.address?.state || "",
          district: residentData.address?.district || "",
          country: residentData.address?.country || "India",
          fullAddress: residentData.address?.fullAddress || "",
          city: residentData.address?.city || "",
          pincode: residentData.address?.pincode || "",
          latitude: residentData.address?.latitude || "",
          longitude: residentData.address?.longitude || "",
          alternativeAddress: residentData.alternativeAddress || "",
          nearestLandmark: residentData.nearestLandmark || "",
          distanceFromFacility: residentData.distanceFromFacility || "",
          
          // Contact Information
          relativeAdmit: residentData.relativeAdmit || "",
          relationWith: residentData.relationWith || "",
          guardianName: residentData.guardianName || "",
          mobileNo: residentData.mobileNo || "",
          phoneNumber: residentData.phoneNumber || "",
          alternativeContact: residentData.alternativeContact || "",
          emailAddress: residentData.emailAddress || "",
          socialMediaHandle: residentData.socialMediaHandle || "",
          voterId: residentData.voterId || "",
          aadhaarNumber: residentData.aadhaarNumber || "",
          
          // Emergency Contact
          emergencyContactName: residentData.emergencyContactName || "",
          emergencyContactNumber: residentData.emergencyContactNumber || "",
          emergencyContactRelationship: residentData.emergencyContactRelationship || "",
          
          // Health Information
          healthStatus: residentData.healthStatus || "",
          category: residentData.category || "",
          bloodGroup: residentData.bloodGroup || "",
          allergies: residentData.allergies || "",
          knownAllergies: residentData.knownAllergies || "",
          medicalConditions: residentData.medicalConditions || "",
          disabilityStatus: residentData.disabilityStatus || "",
          disabilityDetails: residentData.disabilityDetails || "",
          medications: residentData.medications || "",
          rehabStatus: residentData.rehabStatus || "",
          
          // Vital Signs
          bodyTemperature: residentData.bodyTemperature || "",
          heartRate: residentData.heartRate || "",
          respiratoryRate: residentData.respiratoryRate || "",
          bloodPressure: residentData.bloodPressure || "",
          
          // Additional Health
          primaryDoctor: residentData.primaryDoctor || "",
          preferredHospital: residentData.preferredHospital || "",
          medicalHistoryNotes: residentData.medicalHistoryNotes || "",
          medicalHistory: residentData.medicalHistory || "",
          
          // Comments
          comments: residentData.comments || "",
          generalComments: residentData.generalComments || "",
          medicalNotes: residentData.medicalNotes || "",
          behavioralNotes: residentData.behavioralNotes || "",
          careInstructions: residentData.careInstructions || "",
          priorityLevel: residentData.priorityLevel || "",
          updateSummary: residentData.updateSummary || "",
          updatedBy: residentData.updatedBy || "",
          lastUpdateDate: residentData.lastUpdateDate ? residentData.lastUpdateDate.split('T')[0] : "",
          
          // Informer Information
          informerName: residentData.informerName || "",
          informerMobile: residentData.informerMobile || "",
          informerRelationship: residentData.informerRelationship || "",
          informationDate: residentData.informationDate ? residentData.informationDate.split('T')[0] : "",
          informerAddress: residentData.informerAddress || "",
          informationDetails: residentData.informationDetails || "",
          
          // Transport Information
          conveyanceVehicleNo: residentData.conveyanceVehicleNo || "",
          pickUpPlace: residentData.pickUpPlace || "",
          pickUpTime: residentData.pickUpTime || "",
          entrantName: residentData.entrantName || "",
          driverName: residentData.driverName || "",
          driverMobile: residentData.driverMobile || "",
          transportTime: residentData.transportTime || "",
          transportNotes: residentData.transportNotes || "",
          admittedBy: residentData.admittedBy || "",
          organizationId: residentData.organizationId || "",
          admissionStatus: residentData.admissionStatus || "Admission",
          statusDate: residentData.statusDate ? residentData.statusDate.split('T')[0] : "",
          ward: residentData.ward || "",
          receiptNo: residentData.receiptNo || "",
          letterNo: residentData.letterNo || "",
          itemDescription: residentData.itemDescription || "",
          itemAmount: residentData.itemAmount || "",
          videoUrl: residentData.videoUrl || "",
          
          // Handle existing photos (clear file fields for security)
          photoBeforeAdmission: null, // File input, not URL
          photoAfterAdmission: null,  // File input, not URL
          photo: null,
          documents: residentData.documents || [],
          
          // Store URLs for display purposes
          photoBeforeAdmissionUrl: residentData.photoBeforeAdmissionUrl || residentData.photoBeforeAdmission || residentData.photos?.before,
          photoAfterAdmissionUrl: residentData.photoAfterAdmissionUrl || residentData.photoAfterAdmission || residentData.photos?.after,
        }));
        
        showInfo("Resident data loaded. You can now update the information.");
      }
    } catch (error) {
      console.error("Error fetching resident data:", error);
      showError("Error loading resident data for update");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        showError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      const newDocument = {
        id: Date.now() + Math.random(), // Unique ID for each document
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        category: "", // Will be set by user
        description: "",
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDocument],
      }));
    });

    // Clear the input
    e.target.value = "";
  };

  // Remove document
  const removeDocument = (documentId) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
  };

  // Update document details
  const updateDocumentDetails = (documentId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === documentId ? { ...doc, [field]: value } : doc
      ),
    }));
  };

  // Handle input changes with validation and auto-save
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    const phoneFields = new Set([
      "mobileNo",
      "phoneNumber",
      "alternativeContact",
      "emergencyContactNumber",
      "informerMobile",
      "driverMobile",
    ]);

    let newFormData;
    if (type === "file") {
      // Handle multiple photo fields properly
      newFormData = {
        ...formData,
        [name]: files[0],
      };
    } else {
      const normalizedValue = phoneFields.has(name)
        ? normalizePhoneNumber(value)
        : value;

      newFormData = {
        ...formData,
        [name]: normalizedValue,
      };
    }

    setFormData(newFormData);

    // Real-time validation (only format validation, not required)
    if (registrationFormRules[name]) {
      const validation = validateField(name, newFormData[name], registrationFormRules);
      setFormErrors((prev) => ({
        ...prev,
        [name]: validation.isValid ? "" : validation.error,
      }));
    }

    // Auto-save draft (debounced)
    if (!isUpdateMode) {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        const saveResult = saveFormDraft(newFormData);
        if (saveResult.success) {
          setLastSaved(saveResult.timestamp);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
  };

  // Validate current step
  const focusFirstInvalidField = (stepFields, errors) => {
    const firstInvalidField = stepFields.find((field) => Boolean(errors[field]));
    if (!firstInvalidField) return;

    window.setTimeout(() => {
      const targetField = document.querySelector(`[name="${firstInvalidField}"]`);
      if (!targetField) return;

      // Re-trigger animation each time validation fails.
      targetField.classList.remove("invalid-field-attention");
      void targetField.offsetWidth;
      targetField.classList.add("invalid-field-attention");
      window.setTimeout(() => {
        targetField.classList.remove("invalid-field-attention");
      }, 1000);

      targetField.scrollIntoView({ behavior: "smooth", block: "center" });
      targetField.focus({ preventScroll: true });

      if (
        (targetField.tagName === "INPUT" || targetField.tagName === "TEXTAREA") &&
        typeof targetField.select === "function"
      ) {
        targetField.select();
      }
    }, 60);
  };

  const validateCurrentStep = () => {
    const stepFields = getStepFields(currentStep);
    const stepData = {};
    stepFields.forEach((field) => {
      stepData[field] = formData[field];
    });

    const stepRules = {};
    stepFields.forEach((field) => {
      if (registrationFormRules[field]) {
        stepRules[field] = registrationFormRules[field];
      }
    });

    const { isValid, errors } = validateForm(stepData, stepRules);
    setFormErrors((prev) => {
      const updatedErrors = { ...prev };
      stepFields.forEach((field) => {
        updatedErrors[field] = errors[field] || "";
      });
      return updatedErrors;
    });

    // Show errors on the same step and block moving forward.
    if (!isValid) {
      focusFirstInvalidField(stepFields, errors);
      showError(
        "Please fix validation errors in this step before moving to the next page.",
        5000
      );
    }

    return isValid;
  };

  // Get fields for current step
  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return [
          "registrationNo",
          "admissionDate",
          "name",
          "nameGivenByOrganization",
                    "dateOfBirth",
          "gender",
          "age",
        ];
      case 2:
        return [
          "fullAddress",
          "state",
          "district",
          "guardianName",
          "mobileNo",
          "phoneNumber",
          "alternativeContact",
          "emailAddress",
          "pincode",
          "voterId",
          "aadhaarNumber",
          "emergencyContactNumber",
        ];
      case 3:
        return [
          "healthStatus",
          "bloodGroup",
          "allergies",
          "medicalConditions",
          "category",
          "bodyTemperature",
          "heartRate",
          "respiratoryRate",
        ];
      case 4:
        return [
          "ward",
          "admittedBy",
          "rehabStatus",
          "informerMobile",
          "driverMobile",
          "itemAmount",
        ];
      case 5:
        return [
          "admissionStatus",
          "statusDate",
          "photoBeforeAdmission",
          "photoAfterAdmission",
          "videoUrl",
        ];
      default:
        return [];
    }
  };

  // Handle step navigation
  const handleStepClick = (step) => {
    if (step <= currentStep || validateCurrentStep()) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    } else {
      showWarning("Please fix step errors before proceeding", 3000);
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < formSteps.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const handlePrevStep = () => {
  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  }
};

  const formatFieldName = (field) => {
    const fieldMap = {
      registrationNo: "Registration number",
      admissionDate: "Admission date",
      mobileNo: "Mobile number",
      aadhaarNumber: "Aadhaar number",
      dateOfBirth: "Date of birth",
      emailAddress: "Email address",
      phoneNumber: "Phone number",
      emergencyContactNumber: "Emergency contact number",
    };

    if (fieldMap[field]) return fieldMap[field];

    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  };

  const normalizeValidationMessage = (message) => {
    if (!message || typeof message !== "string") return "Invalid field value";

    const requiredMatch = message.match(/Path `([^`]+)` is required\.?/i);
    if (requiredMatch) {
      return `${formatFieldName(requiredMatch[1])} is required`;
    }

    const castMatch = message.match(/Cast to .* failed .* path "?([^"\s]+)"?/i);
    if (castMatch) {
      return `${formatFieldName(castMatch[1])} has an invalid value`;
    }

    return message;
  };

  const buildCompactValidationMessage = (messages, maxItems = 3) => {
    const normalized = [...new Set((messages || [])
      .filter(Boolean)
      .map((msg) => normalizeValidationMessage(String(msg).trim()))
      .filter(Boolean))];

    if (!normalized.length) {
      return "Please review the highlighted fields and try again.";
    }

    const shown = normalized.slice(0, maxItems);
    const remaining = normalized.length - shown.length;
    return `Please correct: ${shown.join("; ")}${remaining > 0 ? ` (+${remaining} more)` : ""}`;
  };

  // Handle submit with proper photo field handling
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate entire form
    const { isValid, errors } = validateForm(formData, registrationFormRules);
    setFormErrors(errors);

    if (!isValid) {
      const validationMessages = Object.values(errors || {}).filter(Boolean);
      showError(buildCompactValidationMessage(validationMessages), 7000);
      return;
    }

    if (!formData.confirmDetails) {
      showError(
        "Please confirm that all details are accurate before submitting"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData with proper photo handling
      const submitData = new FormData();

      // Add all form fields except photos and documents
      Object.keys(formData).forEach((key) => {
        if (
          key !== "documents" &&
          key !== "photoBeforeAdmission" &&
          key !== "photoAfterAdmission" &&
          key !== "photo" &&
          formData[key] !== null &&
          formData[key] !== ""
        ) {
          submitData.append(key, formData[key]);
        }
      });

      // Handle both photo uploads
      if (formData.photoBeforeAdmission) {
        submitData.append("photoBeforeAdmission", formData.photoBeforeAdmission);
        console.log("Added photoBeforeAdmission:", formData.photoBeforeAdmission.name);
      }

      if (formData.photoAfterAdmission) {
        submitData.append("photoAfterAdmission", formData.photoAfterAdmission);
        console.log("Added photoAfterAdmission:", formData.photoAfterAdmission.name);
      }

      // Handle legacy photo field for backward compatibility
      if (formData.photo) {
        submitData.append("photo", formData.photo);
        console.log("Added legacy photo:", formData.photo.name);
      }

      console.log("Submitting resident data with fields:");
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, typeof value === 'object' ? value.name || 'File' : value);
      }

      const apiUrl = isUpdateMode 
        ? `/api/residents/${residentId}`
        : '/api/residents';
      const method = isUpdateMode ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method: method,
        body: submitData,
      });

      const result = await response.json();
      console.log("Resident API response:", {
        status: response.status,
        result,
      });

      if (!result.success) {
        const submitError = new Error(
          result.message ||
            (isUpdateMode ? "Update failed" : "Registration failed")
        );
        submitError.details = Array.isArray(result.errors) ? result.errors : [];
        submitError.status = response.status;
        throw submitError;
      }

      const newResidentId = result.data._id;
      console.log("Resident created/updated with ID:", newResidentId);

      // Step 2: Upload documents if any
      let documentIds = [];
      if (formData.documents.length > 0) {
        for (const doc of formData.documents) {
          const documentFormData = new FormData();
          documentFormData.append("file", doc.file);
          documentFormData.append("residentId", newResidentId);
          documentFormData.append("name", doc.name);
          documentFormData.append("type", doc.category || "other");

          console.log(
            "Submitting document:",
            Array.from(documentFormData.entries())
          );

          const docResponse = await fetch('/api/documents/upload', {
            method: 'POST',
            body: documentFormData
          });

          const docResult = await docResponse.json();
          console.log("Document upload response:", {
            status: docResponse.status,
            docResult,
          });

          if (!docResponse.ok || !docResult.success) {
            console.error("Document upload failed:", docResult.message, {
              name: doc.name,
            });
            showError(
              `Failed to upload document: ${doc.name}. Error: ${
                docResult.message || "Unknown error"
              }`
            );
            continue; // Continue with other documents
          }

          documentIds.push(docResult.data._id);
        }

        // Update resident with document IDs (for new residents)
        if (documentIds.length > 0 && !isUpdateMode) {
          // Validate documentIds
          if (
            !documentIds.every(
              (id) => typeof id === "string" && id.length === 24
            )
          ) {
            console.error("Invalid documentIds:", documentIds);
            throw new Error("Invalid document IDs format");
          }
          console.log("Updating resident with documentIds:", documentIds);
          const updateResponse = await fetch(
            `/api/residents/${newResidentId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentIds }),
            }
          );
          const updateResult = await updateResponse.json();
          console.log("Resident update response:", {
            status: updateResponse.status,
            updateResult,
          });

          if (!updateResult.success) {
            throw new Error(
              updateResult.message || "Failed to link documents to resident"
            );
          }
        }
      }

      // Success handling
      const successMessage = isUpdateMode
        ? `Resident updated successfully! Registration No: ${
            result.data.registrationNo || "N/A"
          }`
        : `Registration successful! Registration No: ${
            result.data.registrationNo || "N/A"
          }`;

      console.log("Showing success message:", successMessage);
      showSuccess(successMessage, 8000);

      // Clear draft and reset form for new registration
      if (!isUpdateMode) {
        console.log("Resetting form for new registration");
        clearFormDraft();
        setLastSaved(null);
        
        // Reset form with all fields properly cleared
        setFormData({
          registrationNo: "",
          admissionDate: "",
          name: "",
          nameGivenByOrganization: "",
          dateOfBirth: "",
          gender: "",
          age: "",
          weight: "",
          height: "",
          religion: "",
          identificationMark: "",
          state: "",
          district: "",
          country: "India",
          fullAddress: "",
          city: "",
          pincode: "",
          latitude: "",
          longitude: "",
          alternativeAddress: "",
          nearestLandmark: "",
          distanceFromFacility: "",
          relativeAdmit: "",
          relationWith: "",
          guardianName: "",
          mobileNo: "",
          phoneNumber: "",
          alternativeContact: "",
          emailAddress: "",
          socialMediaHandle: "",
          voterId: "",
          aadhaarNumber: "",
          emergencyContactName: "",
          emergencyContactNumber: "",
          emergencyContactRelationship: "",
          healthStatus: "",
          category: "",
          bloodGroup: "",
          allergies: "",
          knownAllergies: "",
          medicalConditions: "",
          disabilityStatus: "",
          disabilityDetails: "",
          medications: "",
          rehabStatus: "",
          bodyTemperature: "",
          heartRate: "",
          respiratoryRate: "",
          bloodPressure: "",
          primaryDoctor: "",
          preferredHospital: "",
          medicalHistoryNotes: "",
          medicalHistory: "",
          comments: "",
          generalComments: "",
          medicalNotes: "",
          behavioralNotes: "",
          careInstructions: "",
          priorityLevel: "",
          updateSummary: "",
          updatedBy: "",
          lastUpdateDate: "",
          informerName: "",
          informerMobile: "",
          informerRelationship: "",
          informationDate: "",
          informerAddress: "",
          informationDetails: "",
          conveyanceVehicleNo: "",
          pickUpPlace: "",
          pickUpTime: "",
          entrantName: "",
          driverName: "",
          driverMobile: "",
          transportTime: "",
          transportNotes: "",
          admittedBy: "",
          organizationId: "",
          admissionStatus: "Admission",
          statusDate: "",
          ward: "",
          receiptNo: "",
          letterNo: "",
          itemDescription: "",
          itemAmount: "",
          videoUrl: "",
          photoBeforeAdmission: null,
          photoAfterAdmission: null,
          photo: null,
          documents: [],
          confirmDetails: false,
        });
        setCurrentStep(1);
        setFormErrors({});
      }
    } catch (error) {
      console.error("Submission error:", {
        message: error.message,
        stack: error.stack,
        details: error.details,
      });

      let errorText =
        error.message || "Unable to submit registration. Please check your connection.";

      if (Array.isArray(error.details) && error.details.length > 0) {
        errorText = buildCompactValidationMessage(error.details);
      } else if (error.message === "Validation error") {
        errorText = "Please review entered values and try again.";
      }

      showError(`Error: ${errorText}`, 8000);
    } finally {
      setIsSubmitting(false);
      console.log("Submission complete, isSubmitting set to false");
    }
  }

  const formFont = {
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
  };

  const SectionDivider = ({ label }) => (
    <div
      style={{
        borderBottom: "2px solid #e0e0e0",
        margin: "2.5rem 0 2rem 0",
        textAlign: "left",
      }}
    >
      <span
        style={{
          background: "#f8f9fa",
          padding: "0 1rem",
          fontWeight: 600,
          fontSize: "1.1rem",
          color: "#0A400C",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </span>
    </div>
  );

  // Document category options
  const documentCategories = [
    { value: "medical", label: "Medical Records" },
    { value: "police_verification", label: "Police Verification" },
    { value: "identity_proof", label: "Identity Proof" },
    { value: "address_proof", label: "Address Proof" },
    { value: "court_documents", label: "Court Documents" },
    { value: "certificates", label: "Certificates" },
    { value: "legal_documents", label: "Legal Documents" },
    { value: "death_certificate", label: "Death Certificate" },
    { value: "post_mortem_report", label: "Post Mortem Report" },
    { value: "admission_form", label: "Admission Form" },
    { value: "transfer_form", label: "Transfer Form" },
    { value: "body_donation_form", label: "Body Donation Form" },
    { value: "other", label: "Other" },
  ];

  const residentStatusOptions = [
    "Admission",
    "Discharge",
    "Transfer",
    "Death",
    "Discharge/Transfer",
    "Body Donation",
  ];

  const selectedStatusLabel = formData.admissionStatus || "Status";
  const statusDateLabel = `${selectedStatusLabel} Date`;
  const photoStatusLabel = selectedStatusLabel || "Status";
  const beforeStatusPhotoLabel = `Before ${photoStatusLabel} Photo`;
  const afterStatusPhotoLabel = `After ${photoStatusLabel} Photo`;

  const getHealthStatusDisplayValue = (status) => {
    const normalizedStatus = (status || "").trim();
    return normalizedStatus ? normalizedStatus : "N/A";
  };

  const getHealthStatusBadgeClass = (status) => {
    const normalizedStatus = getHealthStatusDisplayValue(status).toLowerCase();

    if (normalizedStatus === "n/a") return "bg-secondary";
    if (normalizedStatus.includes("good") || normalizedStatus.includes("excellent")) return "bg-success";
    if (normalizedStatus.includes("critical") || normalizedStatus.includes("poor")) return "bg-danger";
    return "bg-warning";
  };

  const stepValidationGuides = {
    1: [
      "Admission Date should be valid.",
      "Age must be between 0 and 150.",
      "Weight and Height cannot be negative.",
      "Choose only allowed Gender values.",
    ],
    2: [
      "PIN Code must be exactly 6 digits.",
      "Mobile, alternative, and emergency contacts must be 10 digits.",
      "Aadhaar must be exactly 12 digits.",
      "Voter ID format: ABC1234567.",
      "Email must be a valid email address.",
    ],
    3: [
      "Category should be Other, Emergency, or Routine.",
      "Body Temperature must be between 30 and 45 degree C.",
      "Heart Rate must be between 30 and 200 BPM.",
      "Respiratory Rate must be between 5 and 40.",
    ],
    4: [
      "Informer and Driver mobile numbers must be 10 digits.",
      "Item Amount cannot be negative.",
      "Use valid date/time for Information Date and Pick Up Time.",
    ],
    5: [
      "Select the current resident status before uploading evidence.",
      "Record the date related to the selected resident status.",
      "Photos should be image files only.",
      "Each uploaded file must be within size limits.",
      "Upload all files related to the selected resident status.",
      "Video URL must start with http:// or https://.",
    ],
    6: [
      "Confirm all details before final submission.",
      "Fix any field-level errors shown in red.",
      "If submit fails, review the top error toast and edit listed fields.",
    ],
  };

  const ValidationGuide = ({ step }) => {
    const rules = stepValidationGuides[step] || [];
    if (!rules.length) return null;

    return (
      <div className="alert alert-light border mb-4" role="alert">
        <div className="d-flex align-items-start">
          <i className="fas fa-shield-alt text-primary me-2 mt-1"></i>
          <div>
            <strong className="d-block">Validation Guide</strong>
            <ul className="mb-0 mt-2 ps-3">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const validationHints = {
    age: "Use a whole number from 0 to 150.",
    pincode: "Enter exactly 6 digits.",
    mobileNo: "Enter 10 digits starting with 6, 7, 8, or 9.",
    tenDigitPhone: "Enter exactly 10 digits.",
    emailAddress: "Use a valid email format (example: name@example.com).",
    voterId: "Use format ABC1234567 (3 capital letters + 7 digits).",
    aadhaarNumber: "Enter exactly 12 digits (no spaces or dashes).",
    bodyTemperature: "Allowed range: 30 to 45 degree C.",
    heartRate: "Allowed range: 30 to 200 BPM.",
    respiratoryRate: "Allowed range: 5 to 40 breaths per minute.",
    itemAmount: "Amount cannot be negative.",
    videoUrl: "Use a full URL starting with http:// or https://.",
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading resident data...</p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1
              className="text-center mt-5 pt-5"
              style={{
                color: "#0A400C",
                fontFamily: "Inter, Arial, Helvetica, sans-serif",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              <i className="fa fa-id-card-o me-2"></i>
              {isUpdateMode ? "Update Resident Information" : "Registration Form"}
            </h1>
          </div>

          <div
            className={`container mt-4 mb-5 shadow-lg p-5 rounded bg-light ${
              animate ? "form-container-animate" : ""
            }`}
            style={formFont}
          >
        {/* Form Steps */}
        <FormSteps
          steps={formSteps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {/* Auto-save Status */}
        {!isUpdateMode && (
          <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light border rounded">
            <div className="d-flex align-items-center">
              <i className="fas fa-check-circle text-primary me-2"></i>
              <span className="text-primary fw-bold">Auto-save enabled</span>
              {lastSaved && (
                <span className="text-muted ms-4 small">
                  Last saved: {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear the saved draft? This will reset all form fields."
                  )
                ) {
                  clearFormDraft();
                  setLastSaved(null);
                  // Reset all form data to initial state
                  setFormData({
                    registrationNo: "",
                    admissionDate: "",
                    name: "",
                    nameGivenByOrganization: "",
                    dateOfBirth: "",
                    gender: "",
                    age: "",
                    weight: "",
                    height: "",
                    religion: "",
                    identificationMark: "",
                    state: "",
                    district: "",
                    country: "India",
                    fullAddress: "",
                    city: "",
                    pincode: "",
                    latitude: "",
                    longitude: "",
                    alternativeAddress: "",
                    nearestLandmark: "",
                    distanceFromFacility: "",
                    relativeAdmit: "",
                    relationWith: "",
                    guardianName: "",
                    mobileNo: "",
                    phoneNumber: "",
                    alternativeContact: "",
                    emailAddress: "",
                    socialMediaHandle: "",
                    voterId: "",
                    aadhaarNumber: "",
                    emergencyContactName: "",
                    emergencyContactNumber: "",
                    emergencyContactRelationship: "",
                    healthStatus: "",
                    category: "",
                    bloodGroup: "",
                    allergies: "",
                    knownAllergies: "",
                    medicalConditions: "",
                    disabilityStatus: "",
                    disabilityDetails: "",
                    medications: "",
                    rehabStatus: "",
                    bodyTemperature: "",
                    heartRate: "",
                    respiratoryRate: "",
                    bloodPressure: "",
                    primaryDoctor: "",
                    preferredHospital: "",
                    medicalHistoryNotes: "",
                    medicalHistory: "",
                    comments: "",
                    generalComments: "",
                    medicalNotes: "",
                    behavioralNotes: "",
                    careInstructions: "",
                    priorityLevel: "",
                    updateSummary: "",
                    updatedBy: "",
                    lastUpdateDate: "",
                    informerName: "",
                    informerMobile: "",
                    informerRelationship: "",
                    informationDate: "",
                    informerAddress: "",
                    informationDetails: "",
                    conveyanceVehicleNo: "",
                    pickUpPlace: "",
                    pickUpTime: "",
                    entrantName: "",
                    driverName: "",
                    driverMobile: "",
                    transportTime: "",
                    transportNotes: "",
                    admittedBy: "",
                    organizationId: "",
                    admissionStatus: "Admission",
                    statusDate: "",
                    ward: "",
                    receiptNo: "",
                    letterNo: "",
                    itemDescription: "",
                    itemAmount: "",
                    videoUrl: "",
                    photoBeforeAdmission: null,
                    photoAfterAdmission: null,
                    photo: null,
                    documents: [],
                    confirmDetails: false,
                  });
                  // Reset form errors and step
                  setFormErrors({});
                  setCurrentStep(1);
                  showSuccess(
                    "Draft cleared and form reset successfully",
                    3000
                  );
                }
              }}
              className="btn btn-outline-danger btn-sm"
            >
              Clear Draft
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
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
              <ValidationGuide step={1} />
              <div className="row g-4">
                <div className="col-md-6">
                  <FormField
                    label="Registration No."
                    name="registrationNo"
                    value={formData.registrationNo}
                    onChange={handleInputChange}
                    error={formErrors.registrationNo}
                    placeholder="e.g. REG001, REG-2024-001"
                    helper="Unique identifier for this resident. Leave blank to auto-generate."
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Admission Date"
                    name="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    error={formErrors.admissionDate}
                    helper="Date when the resident was admitted to the facility."
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Name Given by Organization"
                    name="nameGivenByOrganization"
                    value={formData.nameGivenByOrganization}
                    onChange={handleInputChange}
                    error={formErrors.nameGivenByOrganization}
                    placeholder="Enter name given by organization"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    error={formErrors.dateOfBirth}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Gender"
                    name="gender"
                    type="select"
                    value={formData.gender}
                    onChange={handleInputChange}
                    error={formErrors.gender}
                    options={[
                      { value: "", label: "Select Gender" },
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    error={formErrors.age}
                    placeholder="Enter age"
                    min="0"
                    max="150"
                    helper={validationHints.age}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Weight (kg)"
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange}
                    error={formErrors.weight}
                    placeholder="Enter weight in kg"
                    min="0"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Height (cm)"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleInputChange}
                    error={formErrors.height}
                    placeholder="Enter height in cm"
                    min="0"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Religion"
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    error={formErrors.religion}
                    placeholder="Enter religion"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Identification Mark"
                    name="identificationMark"
                    value={formData.identificationMark}
                    onChange={handleInputChange}
                    error={formErrors.identificationMark}
                    placeholder="Enter identification mark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
              <h3
                className="heading mb-4"
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#0A400C",
                }}
              >
                Contact & Address Information
              </h3>
              <ValidationGuide step={2} />
              <div className="row g-4">
                <div className="col-12">
                  <FormField
                    label="Full Address"
                    name="fullAddress"
                    type="textarea"
                    value={formData.fullAddress}
                    onChange={handleInputChange}
                    error={formErrors.fullAddress}
                    placeholder="Enter complete address"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    error={formErrors.state}
                    placeholder="Enter state"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="District"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    error={formErrors.district}
                    placeholder="Enter district"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={formErrors.city}
                    placeholder="Enter city"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="PIN Code"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    error={formErrors.pincode}
                    placeholder="6-digit PIN code"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    helper={validationHints.pincode}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Guardian Name"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleInputChange}
                    error={formErrors.guardianName}
                    placeholder="Enter guardian name"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Relative Who Admitted"
                    name="relativeAdmit"
                    value={formData.relativeAdmit}
                    onChange={handleInputChange}
                    error={formErrors.relativeAdmit}
                    placeholder="Enter relative name"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Relationship"
                    name="relationWith"
                    value={formData.relationWith}
                    onChange={handleInputChange}
                    error={formErrors.relationWith}
                    placeholder="Enter Relation"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Mobile Number"
                    name="mobileNo"
                    type="tel"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    error={formErrors.mobileNo}
                    placeholder="e.g. 9876543210"
                    helper={validationHints.mobileNo}
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Alternative Contact"
                    name="alternativeContact"
                    value={formData.alternativeContact || ""}
                    onChange={handleInputChange}
                    error={formErrors.alternativeContact}
                    placeholder="Alternative contact number"
                    helper={validationHints.tenDigitPhone}
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Email Address"
                    name="emailAddress"
                    type="email"
                    value={formData.emailAddress || ""}
                    onChange={handleInputChange}
                    error={formErrors.emailAddress}
                    placeholder="Email address"
                    helper={validationHints.emailAddress}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Voter ID"
                    name="voterId"
                    value={formData.voterId}
                    onChange={handleInputChange}
                    error={formErrors.voterId}
                    placeholder="Enter voter ID"
                    helper={validationHints.voterId}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Aadhaar Number"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    error={formErrors.aadhaarNumber}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength="12"
                    pattern="[0-9]{12}"
                    helper={validationHints.aadhaarNumber}
                  />
                </div>

                <div className="col-12 mt-4">
                  <h5 style={{ color: "red", fontWeight: 700 }}>
                    Emergency Contact
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <FormField
                        label="Emergency Contact Name"
                        name="emergencyContactName"
                        value={formData.emergencyContactName || ""}
                        onChange={handleInputChange}
                        error={formErrors.emergencyContactName}
                        placeholder="Emergency contact person"
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Emergency Contact Number"
                        name="emergencyContactNumber"
                        value={formData.emergencyContactNumber || ""}
                        onChange={handleInputChange}
                        error={formErrors.emergencyContactNumber}
                        placeholder="Emergency contact number"
                        helper={validationHints.tenDigitPhone}
                        maxLength="10"
                        pattern="[0-9]{10}"
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Emergency Contact Relationship"
                        name="emergencyContactRelationship"
                        type="select"
                        value={formData.emergencyContactRelationship || ""}
                        onChange={handleInputChange}
                        error={formErrors.emergencyContactRelationship}
                        options={[
                          { value: "", label: "Select Relationship" },
                          { value: "Parent", label: "Parent" },
                          { value: "Sibling", label: "Sibling" },
                          { value: "Spouse", label: "Spouse" },
                          { value: "Friend", label: "Friend" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Health Information */}
          {currentStep === 3 && (
            <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
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
              <ValidationGuide step={3} />
              <div className="row g-4">
                <div className="col-md-6">
                  <FormField
                    label="Health Status"
                    name="healthStatus"
                    type="select"
                    value={formData.healthStatus}
                    onChange={handleInputChange}
                    error={formErrors.healthStatus}
                    options={[
                      { value: "", label: "Select Health Status" },
                      { value: "Good", label: "Good" },
                      { value: "Fair", label: "Fair" },
                      { value: "Critical", label: "Critical" },
                      { value: "Stable", label: "Stable" },
                    ]}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Blood Group"
                    name="bloodGroup"
                    type="select"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    error={formErrors.bloodGroup}
                    options={[
                      { value: "", label: "Select Blood Group" },
                      { value: "A+", label: "A+" },
                      { value: "A-", label: "A-" },
                      { value: "B+", label: "B+" },
                      { value: "B-", label: "B-" },
                      { value: "AB+", label: "AB+" },
                      { value: "AB-", label: "AB-" },
                      { value: "O+", label: "O+" },
                      { value: "O-", label: "O-" },
                    ]}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Category"
                    name="category"
                    type="select"
                    value={formData.category}
                    onChange={handleInputChange}
                    error={formErrors.category}
                    options={[
                      { value: "", label: "Select Category" },
                      { value: "Other", label: "Other" },
                      { value: "Emergency", label: "Emergency" },
                      { value: "Routine", label: "Routine" },
                    ]}
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Disability Status"
                    name="disabilityStatus"
                    type="select"
                    value={formData.disabilityStatus}
                    onChange={handleInputChange}
                    error={formErrors.disabilityStatus}
                    options={[
                      { value: "", label: "Select Status" },
                      { value: "None", label: "None" },
                      { value: "Physical", label: "Physical" },
                      { value: "Mental", label: "Mental" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>

                {/* Vital Signs & Physical Metrics */}
                <div className="col-12 mt-4">
                  <h5 style={{ color: "#00bfff", fontWeight: 700 }}>
                    Vital Signs & Physical Metrics
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <FormField
                        label="Body Temperature (°C)"
                                                name="bodyTemperature"
                        type="number"
                        value={formData.bodyTemperature || ""}
                        onChange={handleInputChange}
                        error={formErrors.bodyTemperature}
                        placeholder="Normal: 36.5-37.5"
                        min="30"
                        max="45"
                        step="0.1"
                        helper={validationHints.bodyTemperature}
                      />
                    </div>
                    <div className="col-md-3">
                      <FormField
                        label="Heart Rate (BPM)"
                        name="heartRate"
                        type="number"
                        value={formData.heartRate || ""}
                        onChange={handleInputChange}
                        error={formErrors.heartRate}
                        placeholder="Normal: 60-100"
                        min="30"
                        max="200"
                        helper={validationHints.heartRate}
                      />
                    </div>
                    <div className="col-md-3">
                      <FormField
                        label="Respiratory Rate"
                        name="respiratoryRate"
                        type="number"
                        value={formData.respiratoryRate || ""}
                        onChange={handleInputChange}
                        error={formErrors.respiratoryRate}
                        placeholder="Normal: 12-20"
                        min="5"
                        max="40"
                        helper={validationHints.respiratoryRate}
                      />
                    </div>
                    <div className="col-md-3">
                      <FormField
                        label="Blood Pressure"
                        name="bloodPressure"
                        value={formData.bloodPressure || ""}
                        onChange={handleInputChange}
                        error={formErrors.bloodPressure}
                        placeholder="e.g., 120/80"
                      />
                    </div>
                  </div>
                </div>

                {/* Disability Details */}
                <div className="col-md-6">
                  <FormField
                    label="Rehabilitation Status"
                    name="rehabStatus"
                    type="select"
                    value={formData.rehabStatus}
                    onChange={handleInputChange}
                    error={formErrors.rehabStatus}
                    options={[
                      { value: "", label: "Select Status" },
                      { value: "Ongoing", label: "Ongoing" },
                      { value: "Completed", label: "Completed" },
                      { value: "Not Required", label: "Not Required" },
                    ]}
                  />
                </div>
                <div className="col-12">
                  <FormField
                    label="Disability Details"
                    name="disabilityDetails"
                    type="textarea"
                    value={formData.disabilityDetails || ""}
                    onChange={handleInputChange}
                    error={formErrors.disabilityDetails}
                    placeholder="Detailed description of disability, limitations, or special needs"
                  />
                </div>

                {/* Allergies & Medical Conditions */}
                <div className="col-12 mt-4">
                  <h5 style={{ color: "red", fontWeight: 700 }}>
                    Allergies & Medical Conditions
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <FormField
                        label="Known Allergies"
                        name="knownAllergies"
                        type="textarea"
                        value={formData.knownAllergies || ""}
                        onChange={handleInputChange}
                        error={formErrors.knownAllergies}
                        placeholder="List any known allergies (food, medication, environmental)"
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Medical Conditions"
                        name="medicalConditions"
                        type="textarea"
                        value={formData.medicalConditions}
                        onChange={handleInputChange}
                        error={formErrors.medicalConditions}
                        placeholder="Current medical conditions, chronic illnesses, past surgeries"
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Current Medications"
                        name="medications"
                        type="textarea"
                        value={formData.medications || ""}
                        onChange={handleInputChange}
                        error={formErrors.medications}
                        placeholder="List current medications with dosage and frequency"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Health Information */}
                <div className="col-12 mt-4">
                  <h5 style={{ color: "green", fontWeight: 700 }}>
                    Additional Health Information
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <FormField
                        label="Primary Doctor"
                        name="primaryDoctor"
                        value={formData.primaryDoctor || ""}
                        onChange={handleInputChange}
                        error={formErrors.primaryDoctor}
                        placeholder="Name of primary doctor"
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Preferred Hospital"
                        name="preferredHospital"
                        value={formData.preferredHospital || ""}
                        onChange={handleInputChange}
                        error={formErrors.preferredHospital}
                        placeholder="Preferred hospital for treatment"
                      />
                    </div>
                    <div className="col-12">
                      <FormField
                        label="Medical History Notes"
                        name="medicalHistoryNotes"
                        type="textarea"
                        value={formData.medicalHistoryNotes || ""}
                        onChange={handleInputChange}
                        error={formErrors.medicalHistoryNotes}
                        placeholder="Additional medical history, family history, or important notes"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Administrative Information */}
          {currentStep === 4 && (
            <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
              <h3
                className="heading mb-4"
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#0A400C",
                }}
              >
                <i className="fas fa-clipboard-list me-2"></i>
                Administrative Information
              </h3>
              <ValidationGuide step={4} />
              
              {/* Informer Information */}
              <div className="mb-4">
                <h5 style={{ color: "#007bff", fontWeight: 700 }}>
                  Informer Information
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <FormField
                      label="Informer Name"
                      name="informerName"
                      value={formData.informerName}
                      onChange={handleInputChange}
                      error={formErrors.informerName}
                      placeholder="Name of person providing information"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Informer Mobile"
                      name="informerMobile"
                      type="tel"
                      value={formData.informerMobile}
                      onChange={handleInputChange}
                      error={formErrors.informerMobile}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      helper={validationHints.tenDigitPhone}
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Relationship to Resident"
                      name="informerRelationship"
                      type="select"
                      value={formData.informerRelationship}
                      onChange={handleInputChange}
                      error={formErrors.informerRelationship}
                      options={[
                        { value: "", label: "Select Relationship" },
                        { value: "Family Member", label: "Family Member" },
                        { value: "Friend", label: "Friend" },
                        { value: "Neighbor", label: "Neighbor" },
                        { value: "Social Worker", label: "Social Worker" },
                        { value: "Police", label: "Police" },
                        { value: "Hospital Staff", label: "Hospital Staff" },
                        {
                          value: "Government Official",
                          label: "Government Official",
                        },
                        { value: "NGO Worker", label: "NGO Worker" },
                        { value: "Self", label: "Self" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Information Date"
                      name="informationDate"
                      type="date"
                      value={formData.informationDate}
                      onChange={handleInputChange}
                      error={formErrors.informationDate}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Informer Address"
                      name="informerAddress"
                      value={formData.informerAddress}
                      onChange={handleInputChange}
                      error={formErrors.informerAddress}
                      placeholder="Informer's address"
                    />
                  </div>
                  <div className="col-12">
                    <FormField
                      label="Information Details"
                      name="informationDetails"
                      type="textarea"
                      value={formData.informationDetails}
                      onChange={handleInputChange}
                      error={formErrors.informationDetails}
                      placeholder="Details about how and why this information was provided"
                    />
                  </div>
                </div>
              </div>

              {/* Transportation Details */}
              <div className="mb-4">
                <h5 style={{ color: "#00bfff", fontWeight: 700 }}>
                  Transport Details
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <FormField
                      label="Vehicle Number"
                      name="conveyanceVehicleNo"
                      value={formData.conveyanceVehicleNo || ""}
                      onChange={handleInputChange}
                      error={formErrors.conveyanceVehicleNo}
                      placeholder="TRANSPORT VEHICLE NUMBER"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Driver Name"
                      name="driverName"
                      value={formData.driverName || ""}
                      onChange={handleInputChange}
                      error={formErrors.driverName}
                      placeholder="Driver's full name"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Driver Mobile"
                      name="driverMobile"
                      value={formData.driverMobile || ""}
                      onChange={handleInputChange}
                      error={formErrors.driverMobile}
                      placeholder="Driver's mobile number"
                      helper={validationHints.tenDigitPhone}
                      maxLength="10"
                      pattern="[0-9]{10}"
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Pick Up Place"
                      name="pickUpPlace"
                      value={formData.pickUpPlace || ""}
                      onChange={handleInputChange}
                      error={formErrors.pickUpPlace}
                      placeholder="Location where resident was picked up"
                    />
                  </div>
                  <div className="col-md-6">
                    <FormField
                      label="Pick Up Time"
                      name="pickUpTime"
                      type="datetime-local"
                      value={formData.pickUpTime || ""}
                      onChange={handleInputChange}
                      error={formErrors.pickUpTime}
                      placeholder="dd-mm-yyyy --:--"
                    />
                  </div>
                </div>
              </div>

              {/* Organization & Admission Details */}
              <div className="mb-4">
                <h5 style={{ color: "green", fontWeight: 700 }}>
                  Organization & Admission Details
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <FormField
                      label="Admitted By"
                      name="admittedBy"
                      value={formData.admittedBy || ""}
                      onChange={handleInputChange}
                      error={formErrors.admittedBy}
                      placeholder="Name of admitting officer"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Data Entrant Name"
                      name="entrantName"
                      value={formData.entrantName || ""}
                      onChange={handleInputChange}
                      error={formErrors.entrantName}
                      placeholder="Name of person who entered data"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Ward Assignment"
                      name="ward"
                      value={formData.ward || ""}
                      onChange={handleInputChange}
                      error={formErrors.ward}
                      placeholder="Ward or room assignment"
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Documentation */}
              <div className="mb-4">
                <h5 style={{ color: "#ffc107", fontWeight: 700 }}>
                  Financial & Documentation
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <FormField
                      label="Receipt Number"
                      name="receiptNo"
                      value={formData.receiptNo || ""}
                      onChange={handleInputChange}
                      error={formErrors.receiptNo}
                      placeholder="Financial receipt number"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Letter Number"
                      name="letterNo"
                      value={formData.letterNo || ""}
                      onChange={handleInputChange}
                      error={formErrors.letterNo}
                      placeholder="Official letter number"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormField
                      label="Item Amount (₹)"
                      name="itemAmount"
                      value={formData.itemAmount || ""}
                      onChange={handleInputChange}
                      error={formErrors.itemAmount}
                      placeholder="Value of items/money"
                      type="number"
                      min="0"
                      helper={validationHints.itemAmount}
                    />
                  </div>
                  <div className="col-12">
                    <FormField
                      label="Item Description"
                      name="itemDescription"
                      type="textarea"
                      value={formData.itemDescription || ""}
                      onChange={handleInputChange}
                      error={formErrors.itemDescription}
                      placeholder="Detailed description of personal belongings, money, or items found with resident"
                    />
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <FormField
                    label="Organization ID"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    error={formErrors.organizationId}
                    placeholder="Organization identifier"
                  />
                </div>
                <div className="col-12">
                  <FormField
                    label="Transport Notes"
                    name="transportNotes"
                    type="textarea"
                    value={formData.transportNotes}
                    onChange={handleInputChange}
                    error={formErrors.transportNotes}
                    placeholder="Additional notes about transportation, condition at pickup, etc."
                                    />
                </div>
                <div className="col-12">
                  <FormField
                    label="Comments"
                    name="comments"
                    type="textarea"
                    value={formData.comments}
                    onChange={handleInputChange}
                    error={formErrors.comments}
                    placeholder="Enter any additional comments"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Documents & Photos */}
          {currentStep === 5 && (
            <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
              <h3
                className="heading mb-4"
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#0A400C",
                }}
              >
                Documents & Media
              </h3>
              <ValidationGuide step={5} />

              <div className="alert alert-warning mb-4" role="alert">
                <div className="d-flex align-items-start">
                  <i className="fas fa-flag-checkered me-2 mt-1"></i>
                  <div>
                    <strong>Resident Status</strong>
                    <div className="mt-2 d-flex flex-wrap gap-3">
                      {residentStatusOptions.map((status) => (
                        <div className="form-check form-check-inline mb-0" key={status}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name="admissionStatus"
                            id={`status-${status.replace(/[^a-zA-Z0-9]/g, "-")}`}
                            value={status}
                            checked={formData.admissionStatus === status}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`status-${status.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3" style={{ maxWidth: "360px" }}>
                      <FormField
                        label={statusDateLabel}
                        name="statusDate"
                        type="date"
                        value={formData.statusDate}
                        onChange={handleInputChange}
                        error={formErrors.statusDate}
                        helper={`Capture the date when the resident was marked as ${selectedStatusLabel.toLowerCase()}.`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Upload Section - Both Photos */}
              <div className="row g-4 mb-5">
                <div className="col-12">
                  <h5
                    className="text-secondary mb-3"
                    style={{
                      fontWeight: 600,
                      borderBottom: "1px solid #dee2e6",
                      paddingBottom: "8px",
                    }}
                  >
                    📸 Photo Upload
                  </h5>
                </div>
                <div className="col-md-6">
                  <FormField
                    label={beforeStatusPhotoLabel}
                    name="photoBeforeAdmission"
                    type="file"
                    onChange={handleInputChange}
                    error={formErrors.photoBeforeAdmission}
                    accept="image/*"
                    helpText={`Upload ${selectedStatusLabel.toLowerCase()} related before photo (JPG, PNG, max 10MB)`}
                  />
                  {/* Display existing photo if in update mode */}
                  {isUpdateMode && formData.photoBeforeAdmissionUrl && (
                    <div className="mt-2">
                      <small className="text-muted">Current photo:</small>
                      <img 
                        src={formData.photoBeforeAdmissionUrl} 
                        alt={beforeStatusPhotoLabel}
                        className="img-thumbnail mt-1"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                      />
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <FormField
                    label={afterStatusPhotoLabel}
                    name="photoAfterAdmission"
                    type="file"
                    onChange={handleInputChange}
                    error={formErrors.photoAfterAdmission}
                    accept="image/*"
                    helpText={`Upload ${selectedStatusLabel.toLowerCase()} related after photo (JPG, PNG, max 10MB)`}
                  />
                  {/* Display existing photo if in update mode */}
                  {isUpdateMode && formData.photoAfterAdmissionUrl && (
                    <div className="mt-2">
                      <small className="text-muted">Current photo:</small>
                      <img 
                        src={formData.photoAfterAdmissionUrl} 
                        alt={afterStatusPhotoLabel}
                        className="img-thumbnail mt-1"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                      />
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <FormField
                    label="Video URL"
                    name="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    error={formErrors.videoUrl}
                    placeholder="https://..."
                    helper={validationHints.videoUrl}
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="row g-4">
                <div className="col-12">
                  <h5
                    className="text-secondary mb-3"
                    style={{
                      fontWeight: 600,
                      borderBottom: "1px solid #dee2e6",
                      paddingBottom: "8px",
                    }}
                  >
                    📄 Upload Documents{" "}
                    <span className="badge bg-secondary ms-2"></span>
                  </h5>
                  <div className="alert alert-info mb-4" role="alert">
                    <div className="d-flex align-items-start">
                      <i className="fas fa-info-circle me-2 mt-1"></i>
                      <div>
                        <strong>Document Types You Can Upload:</strong>
                        <p className="mb-2 mt-2">
                          Please upload all documents related to the selected status:
                          <span className="fw-bold"> {selectedStatusLabel}</span>
                        </p>
                        <ul className="mb-0 mt-2">
                          <li>Medical records and reports</li>
                          <li>Police verification documents</li>
                          <li>
                            Identity proofs (Passport, Driving License, etc.)
                          </li>
                          <li>Address proof documents</li>
                          <li>Court documents and legal papers</li>
                          <li>Educational certificates</li>
                          <li>Other relevant documents</li>
                        </ul>
                        <small className="text-muted d-block mt-2">
                          Maximum file size: 10MB per document. Supported
                          formats: PDF, DOC, DOCX, JPG, PNG
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Input */}
                <div className="col-12">
                  <div
                    className="border-2 border-dashed rounded p-4 text-center"
                    style={{
                      borderColor: "#0A400C",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                    <div className="mb-3">
                      <label
                        htmlFor="documentUpload"
                        className="form-label fw-bold"
                      >
                        Choose Documents to Upload
                      </label>
                      <input
                        type="file"
                        id="documentUpload"
                        className="form-control"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                      />
                    </div>
                    <small className="text-muted">
                      You can select multiple files at once. Hold Ctrl/Cmd to
                      select multiple files.
                    </small>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {formData.documents.length > 0 && (
                  <div className="col-12">
                    <h6 className="fw-bold mb-3">
                      Uploaded Documents ({formData.documents.length})
                    </h6>
                    <div
                      className="border rounded p-3"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {formData.documents.map((doc, index) => (
                        <div
                          key={doc.id}
                          className="border rounded p-3 mb-3 bg-white"
                        >
                          <div className="row align-items-center">
                            <div className="col-md-4">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-file-alt text-primary me-2"></i>
                                <div>
                                  <strong className="d-block">
                                    {doc.name}
                                  </strong>
                                  <small className="text-muted">
                                    {(doc.size / 1024 / 1024).toFixed(2)} MB
                                  </small>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <select
                                className="form-select form-select-sm"
                                value={doc.category}
                                onChange={(e) =>
                                  updateDocumentDetails(
                                    doc.id,
                                    "category",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">Select Category</option>
                                {documentCategories.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={doc.description}
                                onChange={(e) =>
                                  updateDocumentDetails(
                                    doc.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="col-md-1">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeDocument(doc.id)}
                                title="Remove document"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="p-5 rounded-3 jumbotron mt-0 shadow-sm bg-white">
              <h3
                className="heading mb-4"
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#0A400C",
                }}
              >
                Review & Confirm All Details
              </h3>
              <ValidationGuide step={6} />

              <div className="alert alert-info mb-4" role="alert">
                <strong>Please review all the information below before submitting the form.</strong> You can go back to any step to make changes.
              </div>

              {/* Step 1: Basic Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#0A400C"}}>
                <h5 className="text-primary mb-4 fw-bold">📋 Basic Information</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Registration No.:</strong> <span className="text-muted">{formData.registrationNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Admission Date:</strong> <span className="text-muted">{formData.admissionDate ? new Date(formData.admissionDate).toLocaleDateString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Full Name:</strong> <span className="text-muted">{formData.name || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Name by Organization:</strong> <span className="text-muted">{formData.nameGivenByOrganization || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Date of Birth:</strong> <span className="text-muted">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Gender:</strong> <span className="text-muted">{formData.gender || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Age:</strong> <span className="text-muted">{formData.age ? `${formData.age} years` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Weight:</strong> <span className="text-muted">{formData.weight ? `${formData.weight} kg` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Height:</strong> <span className="text-muted">{formData.height ? `${formData.height} cm` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Religion:</strong> <span className="text-muted">{formData.religion || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Identification Mark:</strong> <span className="text-muted">{formData.identificationMark || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Category:</strong> <span className="text-muted">{formData.category || "N/A"}</span></div>
                </div>
              </div>

              {/* Step 2: Contact & Address Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
                <h5 className="text-primary mb-4 fw-bold">📞 Contact & Address Information</h5>
                <div className="row g-3">
                  <div className="col-12"><strong>Full Address:</strong> <span className="text-muted">{formData.fullAddress || "N/A"}</span></div>
                  <div className="col-md-6"><strong>City:</strong> <span className="text-muted">{formData.city || "N/A"}</span></div>
                  <div className="col-md-6"><strong>District:</strong> <span className="text-muted">{formData.district || "N/A"}</span></div>
                  <div className="col-md-6"><strong>State:</strong> <span className="text-muted">{formData.state || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Country:</strong> <span className="text-muted">{formData.country || "N/A"}</span></div>
                  <div className="col-md-6"><strong>PIN Code:</strong> <span className="text-muted">{formData.pincode || "N/A"}</span></div>
                  <div className="col-12"><strong>Alternative Address:</strong> <span className="text-muted">{formData.alternativeAddress || "N/A"}</span></div>
                  <div className="col-12"><strong>Nearest Landmark:</strong> <span className="text-muted">{formData.nearestLandmark || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Distance from Facility (km):</strong> <span className="text-muted">{formData.distanceFromFacility || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Latitude:</strong> <span className="text-muted">{formData.latitude || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Longitude:</strong> <span className="text-muted">{formData.longitude || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Mobile Number:</strong> <span className="text-muted">{formData.mobileNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Phone Number:</strong> <span className="text-muted">{formData.phoneNumber || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Alternative Contact:</strong> <span className="text-muted">{formData.alternativeContact || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Email Address:</strong> <span className="text-muted">{formData.emailAddress || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Social Media Handle:</strong> <span className="text-muted">{formData.socialMediaHandle || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Voter ID:</strong> <span className="text-muted">{formData.voterId || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Aadhaar Number:</strong> <span className="text-muted">{formData.aadhaarNumber || "N/A"}</span></div>
                </div>
              </div>

              {/* Guardian & Emergency Contact */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
                <h5 className="text-primary mb-4 fw-bold">👥 Guardian & Emergency Contact</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Guardian Name:</strong> <span className="text-muted">{formData.guardianName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Relative Who Admitted:</strong> <span className="text-muted">{formData.relativeAdmit || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Relationship with Resident:</strong> <span className="text-muted">{formData.relationWith || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Name:</strong> <span className="text-muted">{formData.emergencyContactName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Number:</strong> <span className="text-muted">{formData.emergencyContactNumber || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Emergency Contact Relationship:</strong> <span className="text-muted">{formData.emergencyContactRelationship || "N/A"}</span></div>
                </div>
              </div>

              {/* Step 3: Health Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#dc2626"}}>
                <h5 className="text-primary mb-4 fw-bold">🏥 Health Information</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Health Status:</strong>
                    <span className={`ms-2 badge ${getHealthStatusBadgeClass(formData.healthStatus)}`}>
                      {getHealthStatusDisplayValue(formData.healthStatus)}
                    </span>
                  </div>
                  <div className="col-md-6"><strong>Blood Group:</strong> <span className="text-muted">{formData.bloodGroup || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Body Temperature:</strong> <span className="text-muted">{formData.bodyTemperature ? `${formData.bodyTemperature}°C` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Heart Rate:</strong> <span className="text-muted">{formData.heartRate ? `${formData.heartRate} BPM` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Respiratory Rate:</strong> <span className="text-muted">{formData.respiratoryRate ? `${formData.respiratoryRate}/min` : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Blood Pressure:</strong> <span className="text-muted">{formData.bloodPressure || "N/A"}</span></div>
                  <div className="col-12"><strong>Allergies:</strong> <span className="text-muted">{formData.allergies || "N/A"}</span></div>
                  <div className="col-12"><strong>Other Known Allergies:</strong> <span className="text-muted">{formData.knownAllergies || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical Conditions:</strong> <span className="text-muted">{formData.medicalConditions || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Disability Status:</strong> <span className="text-muted">{formData.disabilityStatus || "N/A"}</span></div>
                  <div className="col-12"><strong>Disability Details:</strong> <span className="text-muted">{formData.disabilityDetails || "N/A"}</span></div>
                  <div className="col-12"><strong>Current Medications:</strong> <span className="text-muted">{formData.medications || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Rehabilitation Status:</strong> <span className="text-muted">{formData.rehabStatus || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Primary Doctor:</strong> <span className="text-muted">{formData.primaryDoctor || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Preferred Hospital:</strong> <span className="text-muted">{formData.preferredHospital || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical History Notes:</strong> <span className="text-muted">{formData.medicalHistoryNotes || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical History:</strong> <span className="text-muted">{formData.medicalHistory || "N/A"}</span></div>
                </div>
              </div>

              {/* Informer Information */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#ea580c"}}>
                <h5 className="text-primary mb-4 fw-bold">ℹ️ Informer Information</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Informer Name:</strong> <span className="text-muted">{formData.informerName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Informer Mobile:</strong> <span className="text-muted">{formData.informerMobile || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Informer Relationship:</strong> <span className="text-muted">{formData.informerRelationship || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Information Date:</strong> <span className="text-muted">{formData.informationDate ? new Date(formData.informationDate).toLocaleDateString() : "N/A"}</span></div>
                  <div className="col-12"><strong>Informer Address:</strong> <span className="text-muted">{formData.informerAddress || "N/A"}</span></div>
                  <div className="col-12"><strong>Information Details:</strong> <span className="text-muted">{formData.informationDetails || "N/A"}</span></div>
                </div>
              </div>

              {/* Step 4: Transport & Organization */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#16a34a"}}>
                <h5 className="text-primary mb-4 fw-bold">🚗 Transport & Organization</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Vehicle No.:</strong> <span className="text-muted">{formData.conveyanceVehicleNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Pick Up Place:</strong> <span className="text-muted">{formData.pickUpPlace || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Pick Up Time:</strong> <span className="text-muted">{formData.pickUpTime ? new Date(formData.pickUpTime).toLocaleString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Transport Time:</strong> <span className="text-muted">{formData.transportTime ? new Date(formData.transportTime).toLocaleString() : "N/A"}</span></div>
                  <div className="col-md-6"><strong>Entrant Name:</strong> <span className="text-muted">{formData.entrantName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Driver Name:</strong> <span className="text-muted">{formData.driverName || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Driver Mobile:</strong> <span className="text-muted">{formData.driverMobile || "N/A"}</span></div>
                  <div className="col-12"><strong>Transport Notes:</strong> <span className="text-muted">{formData.transportNotes || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Admitted By:</strong> <span className="text-muted">{formData.admittedBy || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Ward:</strong> <span className="text-muted">{formData.ward || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Organization ID:</strong> <span className="text-muted">{formData.organizationId || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Resident Status:</strong> <span className="text-muted">{formData.admissionStatus || "N/A"}</span></div>
                  <div className="col-md-6"><strong>{statusDateLabel}:</strong> <span className="text-muted">{formData.statusDate ? new Date(formData.statusDate).toLocaleDateString() : "N/A"}</span></div>
                </div>
              </div>

              {/* Financial & Documentation */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#2563eb"}}>
                <h5 className="text-primary mb-4 fw-bold">💰 Financial & Documentation</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>Receipt No.:</strong> <span className="text-muted">{formData.receiptNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Letter No.:</strong> <span className="text-muted">{formData.letterNo || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Item Amount (₹):</strong> <span className="text-muted">{formData.itemAmount || "N/A"}</span></div>
                  <div className="col-12"><strong>Item Description:</strong> <span className="text-muted">{formData.itemDescription || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Video URL:</strong> <span className="text-muted">{formData.videoUrl ? <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer">{formData.videoUrl}</a> : "N/A"}</span></div>
                </div>
              </div>

              {/* Comments & Notes */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#7c3aed"}}>
                <h5 className="text-primary mb-4 fw-bold">📝 Comments & Notes</h5>
                <div className="row g-3">
                  <div className="col-12"><strong>General Comments:</strong> <span className="text-muted">{formData.comments || "N/A"}</span></div>
                  <div className="col-12"><strong>Additional Comments:</strong> <span className="text-muted">{formData.generalComments || "N/A"}</span></div>
                  <div className="col-12"><strong>Medical Notes:</strong> <span className="text-muted">{formData.medicalNotes || "N/A"}</span></div>
                  <div className="col-12"><strong>Behavioral Notes:</strong> <span className="text-muted">{formData.behavioralNotes || "N/A"}</span></div>
                  <div className="col-12"><strong>Care Instructions:</strong> <span className="text-muted">{formData.careInstructions || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Priority Level:</strong> <span className="text-muted">{formData.priorityLevel || "N/A"}</span></div>
                  <div className="col-12"><strong>Update Summary:</strong> <span className="text-muted">{formData.updateSummary || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Updated By:</strong> <span className="text-muted">{formData.updatedBy || "N/A"}</span></div>
                  <div className="col-md-6"><strong>Last Update Date:</strong> <span className="text-muted">{formData.lastUpdateDate ? new Date(formData.lastUpdateDate).toLocaleDateString() : "N/A"}</span></div>
                </div>
              </div>

              {/* Documents & Photos Review */}
              <div className="mb-5 p-3 border-start border-4" style={{borderLeftColor: "#059669"}}>
                <h5 className="text-primary mb-4 fw-bold">📄 Documents & Media</h5>
                <div className="row g-3">
                  <div className="col-md-6"><strong>{beforeStatusPhotoLabel}:</strong> <span className="text-muted">{formData.photoBeforeAdmission ? formData.photoBeforeAdmission.name : "N/A"}</span></div>
                  <div className="col-md-6"><strong>{afterStatusPhotoLabel}:</strong> <span className="text-muted">{formData.photoAfterAdmission ? formData.photoAfterAdmission.name : "N/A"}</span></div>
                  {formData.documents.length > 0 && (
                    <div className="col-12">
                      <strong>Uploaded Documents ({formData.documents.length}):</strong>
                      <div className="mt-2">
                        {formData.documents.map((doc, index) => (
                          <div key={doc.id} className="border rounded p-2 mb-2 bg-light">
                            <div className="row align-items-center">
                              <div className="col-md-4">
                                <i className="fas fa-file-alt text-primary me-2"></i>
                                <strong>{doc.name}</strong>
                              </div>
                              <div className="col-md-3">
                                <span className="badge bg-secondary">
                                  {documentCategories.find((cat) => cat.value === doc.category)?.label || "Uncategorized"}
                                </span>
                              </div>
                              <div className="col-md-5">
                                {doc.description && <small className="text-muted">{doc.description}</small>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.documents.length === 0 && (
                    <div className="col-12"><span className="text-muted">No documents uploaded</span></div>
                  )}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="mt-4 p-3 bg-light rounded border-2" style={{borderColor: "#0A400C"}}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="confirmDetails"
                    checked={formData.confirmDetails || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmDetails: e.target.checked,
                      }))
                    }
                  />
                  <label
                    className="form-check-label fw-semibold"
                    htmlFor="confirmDetails"
                  >
                    I confirm that all the information provided above is
                    accurate and complete to the best of my knowledge.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="btn btn-outline-secondary px-4 py-2"
              style={{ fontWeight: 600 }}
            >
              Previous
            </button>

            <div className="d-flex gap-2">
              {currentStep < formSteps.length ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary px-4 py-2"
                  style={{
                    background: "#0A400C",
                    borderColor: "#0A400C",
                    fontWeight: 600,
                  }}
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.confirmDetails}
                  className="btn btn-success px-5 py-2"
                  style={{
                    background:
                      isSubmitting || !formData.confirmDetails
                        ? "#6c757d"
                        : "#0A400C",
                    borderColor:
                      isSubmitting || !formData.confirmDetails
                        ? "#6c757d"
                        : "#0A400C",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {isUpdateMode ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check me-2"></i>
                      {isUpdateMode ? "Update Resident" : "Register Resident"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
        </>
      )}
    </>
  );
}

export default RegistrationForm;

