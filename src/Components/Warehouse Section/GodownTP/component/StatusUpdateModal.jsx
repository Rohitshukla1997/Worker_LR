import React, { useState, useEffect, useRef } from 'react'
import { Modal, Button, Form, Badge, ProgressBar, Table } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { FaEye, FaFilePdf, FaSpinner, FaCompressAlt } from 'react-icons/fa'

const StatusUpdateModal = ({ show, onHide, onSubmit, isLoading, currentStatus, recordData }) => {
  const [status, setStatus] = useState(currentStatus === 'Completed' ? 'Completed' : 'Pending')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [quantitiesTaken, setQuantitiesTaken] = useState({})
  const isSubmittingRef = useRef(false)
  const modalBodyRef = useRef(null)

  // Check if record already has an acknowledgement image
  const hasExistingImage = recordData?.acknowledgementImage
  const products = recordData?.products || []

  useEffect(() => {
    if (show) {
      setStatus(currentStatus === 'Completed' ? 'Completed' : 'Pending')
      setImage(null)
      setImagePreview(null)
      setIsSubmitting(false)
      setIsCompressing(false)
      setCompressionProgress(0)
      setOriginalSize(0)
      setCompressedSize(0)
      setQuantitiesTaken({})
      isSubmittingRef.current = false

      // Initialize quantities taken for each product if they exist
      if (products && products.length > 0) {
        const initialQuantities = {}
        products.forEach((product) => {
          // Use updatedQuantityMT if it exists, otherwise use empty string
          initialQuantities[product._id] = product.updatedQuantityMT || ''
        })
        setQuantitiesTaken(initialQuantities)
      }

      // Scroll to top when modal opens
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0
      }
    }
  }, [show, currentStatus, products])

  // Function to compress image
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDimension = 1024 // Max width/height

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Compress with quality
          let quality = 0.9
          let compressedDataUrl
          let blob

          // Try multiple quality levels to get under 50KB
          const compressAttempt = (currentQuality) => {
            compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality)

            // Convert base64 to blob to check size
            const byteString = atob(compressedDataUrl.split(',')[1])
            const mimeString = compressedDataUrl.split(',')[0].split(':')[1].split(';')[0]
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)

            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i)
            }

            blob = new Blob([ab], { type: mimeString })
            const sizeInKB = blob.size / 1024

            setCompressedSize(Math.round(sizeInKB))
            setCompressionProgress(Math.round((currentQuality / 0.9) * 100))

            if (sizeInKB > 50 && currentQuality > 0.1) {
              // Reduce quality and try again
              setTimeout(() => compressAttempt(currentQuality - 0.1), 50)
            } else {
              // Create a proper File object from blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })

              resolve(compressedFile)
            }
          }

          // Start compression
          compressAttempt(quality)
        }

        img.onerror = reject
      }

      reader.onerror = reject
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload only JPG, PNG, or PDF files',
      })
      return
    }

    // Validate file size (original file should not be too large)
    if (file.size > 10 * 1024 * 1024) {
      // 10MB max original size
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Original file size should be less than 10MB',
      })
      return
    }

    // Set original size
    const originalSizeKB = file.size / 1024
    setOriginalSize(Math.round(originalSizeKB))

    // Handle PDF files (no compression needed, just validation)
    if (file.type === 'application/pdf') {
      if (file.size > 50 * 1024) {
        // PDFs also need to be under 50KB
        Swal.fire({
          icon: 'error',
          title: 'PDF Too Large',
          text: 'PDF file must be under 50KB',
        })
        return
      }
      setImage(file)
      setImagePreview(null)
      setCompressedSize(Math.round(originalSizeKB))
      return
    }

    // For images, start compression
    setIsCompressing(true)
    setCompressionProgress(0)

    try {
      // Compress image
      const compressedFile = await compressImage(file)

      // Verify compressed size
      const finalSizeKB = compressedFile.size / 1024

      if (finalSizeKB > 50) {
        Swal.fire({
          icon: 'error',
          title: 'Compression Failed',
          text: 'Unable to compress image to under 50KB. Please try a smaller image.',
        })
        setIsCompressing(false)
        return
      }

      setImage(compressedFile)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setIsCompressing(false)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Compression error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Compression Error',
        text: 'Failed to compress image. Please try again.',
      })
      setIsCompressing(false)
    }
  }

  const handleQuantityChange = (productId, value) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return

    // Validate that value is a number and less than or equal to quantityMT
    const numValue = parseFloat(value)
    if (value === '' || (isNaN(numValue) && value !== '')) {
      setQuantitiesTaken((prev) => ({ ...prev, [productId]: '' }))
      return
    }

    // Ensure value is not less than 0
    if (numValue < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Quantity',
        text: 'Quantity taken cannot be negative',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      })
      return
    }

    // Check if value exceeds quantityMT
    if (numValue > product.quantityMT) {
      Swal.fire({
        icon: 'warning',
        title: 'Quantity Exceeds Limit',
        text: `Quantity taken (${numValue}) cannot exceed ordered quantity (${product.quantityMT})`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      })
      setQuantitiesTaken((prev) => ({ ...prev, [productId]: product.quantityMT.toString() }))
    } else {
      setQuantitiesTaken((prev) => ({ ...prev, [productId]: value }))
    }
  }

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmittingRef.current || isLoading || isCompressing) return

    // Validate image size (should already be compressed, but double-check)
    if (image && image.type.startsWith('image/') && image.size > 50 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Image Too Large',
        text: 'Compressed image is still over 50KB. Please try again.',
      })
      return
    }

    // Validate required image for specific statuses
    if (['Cancelled', 'Partially Correction'].includes(status) && !image) {
      Swal.fire({
        icon: 'error',
        title: 'Image Required',
        text: `Proof image is required for ${status} status`,
      })
      return
    }

    // Validate quantities for Partially Correction status
    if (status === 'Partially Correction') {
      // Check if all products have quantity taken entered
      const missingQuantities = products.filter((product) => {
        const updatedQuantityMT = quantitiesTaken[product._id]
        return !updatedQuantityMT || updatedQuantityMT === ''
      })

      if (missingQuantities.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Quantities',
          text: 'Please enter quantity taken for all products',
        })
        return
      }

      // Validate that quantity taken is less than quantityMT for each product
      const invalidQuantities = products.filter((product) => {
        const updatedQuantityMT = parseFloat(quantitiesTaken[product._id])
        return updatedQuantityMT >= product.quantityMT
      })

      if (invalidQuantities.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Quantities',
          text: 'Quantity taken must be less than the ordered quantity for all products',
        })
        return
      }

      // Check if at least one product has some quantity taken
      const hasSomeQuantityTaken = products.some((product) => {
        const updatedQuantityMT = parseFloat(quantitiesTaken[product._id])
        return updatedQuantityMT > 0
      })

      if (!hasSomeQuantityTaken) {
        Swal.fire({
          icon: 'error',
          title: 'No Quantity Taken',
          text: 'At least one product must have some quantity taken',
        })
        return
      }
    }

    // Set submitting state
    setIsSubmitting(true)
    isSubmittingRef.current = true

    // Prepare data to submit
    const dataToSubmit = {
      status: status,
      image: image, // This is the File object
    }

    // Add products with updatedQuantityMT for Partially Correction status
    if (status === 'Partially Correction') {
      dataToSubmit.products = products.map((product) => ({
        warehouseId: product.warehouseId,
        productId: product.productId,
        _id: product._id,
        updatedQuantityMT: parseFloat(quantitiesTaken[product._id] || 0),
      }))
    }

    try {
      await onSubmit(dataToSubmit)
      // Reset state after successful submission
      setIsSubmitting(false)
      isSubmittingRef.current = false
    } catch (error) {
      // Reset submitting state on error
      setIsSubmitting(false)
      isSubmittingRef.current = false
      // Re-throw the error so parent component can handle it
      throw error
    }
  }

  const handleClose = () => {
    // Only allow closing if not submitting or compressing
    if (!isSubmitting && !isLoading && !isCompressing) {
      setStatus(currentStatus === 'Completed' ? 'Completed' : 'Pending')
      setImage(null)
      setImagePreview(null)
      setIsCompressing(false)
      setCompressionProgress(0)
      setOriginalSize(0)
      setCompressedSize(0)
      setQuantitiesTaken({})
      onHide()
    }
  }

  // Function to view existing image
  const viewExistingImage = () => {
    if (hasExistingImage) {
      if (hasExistingImage.startsWith('data:') || hasExistingImage.startsWith('http')) {
        window.open(hasExistingImage, '_blank')
      } else {
        const imageUrl = `${import.meta.env.VITE_API_URL || ''}${hasExistingImage}`
        window.open(imageUrl, '_blank')
      }
    }
  }

  // Determine if image upload field should be shown
  const shouldShowImageUpload = () => {
    return ['Completed', 'Cancelled', 'Partially Correction'].includes(status)
  }

  // Check if Partially Correction status is selected
  const isPartiallyCorrection = status === 'Partially Correction'

  // Combined processing state
  const isProcessing = isLoading || isSubmitting || isCompressing

  return (
    <Modal show={show} onHide={handleClose} centered size="xl">
      <Modal.Header closeButton={!isProcessing} className="border-bottom-0 pb-0">
        <Modal.Title>Update Status</Modal.Title>
      </Modal.Header>

      <Modal.Body
        ref={modalBodyRef}
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          paddingTop: '0.5rem',
        }}
        className="modal-body-scrollable"
      >
        <Form>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Select Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isProcessing || (currentStatus === 'Completed' && status === 'Completed')}
              className="py-2"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Partially Correction">Partially Correction</option>
            </Form.Select>
            <Form.Text className="text-muted mt-2 d-block">
              {status === 'Completed' ? (
                <span className="text-info">* Image proof is optional for Completed status</span>
              ) : status === 'Cancelled' || status === 'Partially Correction' ? (
                <span className="text-info">* Image proof is required for {status} status</span>
              ) : (
                'No image required for Pending status'
              )}
            </Form.Text>
          </Form.Group>

          {/* Products section for Partially Correction */}
          {isPartiallyCorrection && products && products.length > 0 && (
            <div className="border-top pt-4">
              <h6 className="fw-bold mb-3">Product Details</h6>
              <div className="table-responsive">
                <Table bordered className="mb-4">
                  <thead>
                    <tr className="table-light">
                      <th>Product Name</th>
                      <th>Ordered Quantity (MT)</th>
                      <th>Quantity Taken by Party (MT)</th>
                      <th>Remaining (MT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const updatedQuantityMT = parseFloat(quantitiesTaken[product._id] || 0)
                      const remaining = product.quantityMT - updatedQuantityMT
                      return (
                        <tr key={product._id}>
                          <td className="fw-medium">{product.productName}</td>
                          <td>{product.quantityMT}</td>
                          <td>
                            <Form.Control
                              type="number"
                              min="0"
                              max={product.quantityMT - 0.01} // Allow values up to but not equal to quantityMT
                              step="0.01"
                              value={quantitiesTaken[product._id] || ''}
                              onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                              disabled={isProcessing}
                              className="py-1"
                              placeholder="Enter quantity taken"
                            />
                            <Form.Text className="text-muted">
                              Must be less than {product.quantityMT}
                            </Form.Text>
                          </td>
                          <td
                            className={
                              remaining === 0 ? 'text-success' : remaining > 0 ? 'text-warning' : ''
                            }
                          >
                            {remaining.toFixed(2)}
                            {remaining < 0 && (
                              <Badge bg="danger" className="ms-2">
                                Invalid
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* Show upload field for specific statuses */}
          {shouldShowImageUpload() && (
            <div className="border-top pt-4">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  {status === 'Completed'
                    ? 'Upload Completion Proof (Optional)'
                    : `Upload ${status} Proof`}
                  {status !== 'Completed' && <span className="text-danger ms-1">*</span>}
                  <small className="text-muted ms-2">(Max: 50KB)</small>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleImageChange}
                  required={status !== 'Completed'} // Required for all except Completed
                  disabled={isProcessing}
                  className="py-2"
                />
                <Form.Text className="text-muted mt-2 d-block">
                  Images will be automatically compressed to under 50KB. PDFs must already be under
                  50KB.
                  {status === 'Completed' &&
                    ' Uploading an image is optional for Completed status.'}
                </Form.Text>

                {/* Compression progress */}
                {isCompressing && (
                  <div className="mt-4 p-3 border rounded bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-primary fw-medium">
                        <FaCompressAlt className="me-2" />
                        Compressing image...
                      </small>
                      <small className="fw-bold">{compressionProgress}%</small>
                    </div>
                    <ProgressBar now={compressionProgress} variant="primary" animated />
                    <small className="text-muted mt-3 d-block">
                      Original: {originalSize}KB → Target: ≤50KB
                    </small>
                  </div>
                )}

                {/* Size info */}
                {image && !isCompressing && (
                  <div className="mt-4 p-3 border rounded bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-grow-1 me-3">
                        <p className="mb-1 fw-medium">
                          {image.type === 'application/pdf' ? 'PDF File' : 'Compressed Image'}:
                        </p>
                        <p className="mb-2 text-truncate">
                          <small>{image.name}</small>
                        </p>
                        <p className="small mb-0">
                          <span className="text-muted">Size: </span>
                          <span className="fw-medium">{compressedSize}KB</span>
                          {originalSize > 0 && (
                            <span className="text-muted ms-2">(from {originalSize}KB)</span>
                          )}
                          {compressedSize <= 50 && (
                            <span className="text-success ms-2">✓ Under 50KB limit</span>
                          )}
                        </p>
                      </div>
                      {image.type === 'application/pdf' ? (
                        <FaFilePdf className="text-danger flex-shrink-0" size={28} />
                      ) : (
                        <FaCompressAlt className="text-primary flex-shrink-0" size={28} />
                      )}
                    </div>
                  </div>
                )}

                {/* Image preview */}
                {imagePreview && !isCompressing && (
                  <div className="mt-4">
                    <p className="small fw-medium mb-2">Preview:</p>
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-fluid rounded border"
                        style={{ maxHeight: '180px', maxWidth: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </Form.Group>
            </div>
          )}

          {/* Warning if changing from Completed to something else */}
          {currentStatus === 'Completed' && status !== 'Completed' && (
            <div className="mt-4 p-3 border rounded bg-warning bg-opacity-10">
              <div className="d-flex align-items-start">
                <div className="flex-grow-1">
                  <p className="mb-1 fw-medium">
                    ⚠️ <span className="ms-1">Status Change Warning</span>
                  </p>
                  <p className="small mb-0">
                    Changing status from <span className="fw-medium">Completed</span> to{' '}
                    <span className="fw-medium">{status}</span> will remove the completed status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="mt-4 p-3 border rounded bg-info bg-opacity-10">
              <div className="d-flex align-items-center">
                <FaSpinner className="me-3 fa-spin text-primary" />
                <div>
                  <p className="mb-0 fw-medium">
                    {isCompressing ? 'Compressing image...' : 'Updating status...'}
                  </p>
                  <p className="small mb-0 text-muted">
                    {isCompressing
                      ? 'This may take a few moments depending on image size.'
                      : 'Please wait while we update the status.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={isProcessing}
          className="px-4"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            isProcessing ||
            (status === 'Cancelled' && !image) ||
            (status === 'Partially Correction' && !image)
          }
          className="px-4"
        >
          {isProcessing ? (
            <>
              <FaSpinner className="me-2 fa-spin" />
              {isCompressing ? 'Compressing...' : 'Submitting...'}
            </>
          ) : (
            'Update Status'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

StatusUpdateModal.defaultProps = {
  recordData: null,
}

export default StatusUpdateModal
