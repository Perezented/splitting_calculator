import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Alert, Badge, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export const SplitManager = ({ splits, onSplitsUpdate, show, onHide }) => {
  const [editingSplits, setEditingSplits] = useState([...splits]);
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitValues, setNewSplitValues] = useState('');
  const [error, setError] = useState('');

  // Reset editing splits when modal opens
  useEffect(() => {
    if (show) {
      setEditingSplits([...splits]);
      setError('');
    }
  }, [show, splits]);

  const parseValues = (valuesString) => {
    if (!valuesString) return [];

    // Support multiple separators: comma, space, hyphen, or combinations
    const values = valuesString
      .split(/[,\s-]+/)
      .map(v => v.trim())
      .filter(v => v)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    return values;
  };

  const validateSplit = (values) => {
    if (!values || values.length === 0) return { isValid: false, sum: 0, remaining: 100 };

    const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
    const remaining = 100 - sum;
    const isValid = Math.abs(remaining) < 0.01 && values.every(val => val > 0);

    return { isValid, sum: parseFloat(sum.toFixed(2)), remaining: parseFloat(remaining.toFixed(2)) };
  };

  const getNewSplitValidation = () => {
    const values = parseValues(newSplitValues);
    return validateSplit(values);
  };

  const handleAddSplit = () => {
    setError('');

    if (!newSplitName.trim()) {
      setError('Please enter a name for the split');
      return;
    }

    const values = parseValues(newSplitValues);

    if (values.length === 0) {
      setError('Please enter valid percentage values (separated by commas, spaces, or hyphens)');
      return;
    }

    const validation = validateSplit(values);
    if (!validation.isValid) {
      if (values.some(val => val <= 0)) {
        setError('All percentages must be positive numbers');
      } else {
        setError(`Percentages must sum to 100 (current sum: ${validation.sum}%, remaining: ${validation.remaining}%)`);
      }
      return;
    }

    // Check for duplicate names
    if (editingSplits.some(split => split.name.toLowerCase() === newSplitName.toLowerCase())) {
      setError('A split with this name already exists');
      return;
    }

    const newSplit = {
      name: newSplitName,
      value: values,
      isCustom: true
    };

    setEditingSplits([...editingSplits, newSplit]);
    setNewSplitName('');
    setNewSplitValues('');
  };

  const handleDeleteSplit = (index) => {
    const updatedSplits = editingSplits.filter((_, i) => i !== index);
    setEditingSplits(updatedSplits);
  };

  const handleSplitNameChange = (index, newName) => {
    const updatedSplits = [...editingSplits];
    updatedSplits[index] = {
      ...updatedSplits[index],
      name: newName
    };
    setEditingSplits(updatedSplits);
  };

  const handleSplitValueChange = (index, newValuesString) => {
    const values = parseValues(newValuesString);

    const updatedSplits = [...editingSplits];
    updatedSplits[index] = {
      ...updatedSplits[index],
      value: values,
      // Mark as custom if it was edited (even defaults become custom when edited)
      isCustom: true
    };
    setEditingSplits(updatedSplits);
  };

  const handleSave = () => {
    setError('');

    // Validate all splits
    const invalidSplits = [];
    for (const split of editingSplits) {
      const validation = validateSplit(split.value);
      if (!validation.isValid) {
        invalidSplits.push(`"${split.name}": sum is ${validation.sum}% (remaining: ${validation.remaining}%)`);
      }
    }

    if (invalidSplits.length > 0) {
      setError(`Invalid splits - percentages must sum to 100:\n${invalidSplits.join('\n')}`);
      return;
    }

    if (editingSplits.length === 0) {
      setError('At least one split ratio is required');
      return;
    }

    onSplitsUpdate(editingSplits);
    onHide();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all split ratios to default? (50-50 & 50-40-10) This action cannot be undone.')) {
      localStorage.removeItem('splittingCalculatorSplits');
      setEditingSplits([...splits]);
      setNewSplitName('');
      setNewSplitValues('');
      setError('');
      window.location.reload();
    }
  };

  const newSplitValidation = getNewSplitValidation();

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEdit} className="me-2" />
          Manage Split Ratios
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}

        <div className="mb-4">
          <Card className="bg-light">
            <Card.Body className="py-2">
              <small className="text-muted">
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                <strong>Tips:</strong>
                • All splits are now editable and will be saved
                • Use commas, spaces, or hyphens to separate values (e.g., "50, 30, 20" or "50 30 20" or "50-30-20")
                • Values must be positive and sum to exactly 100%
              </small>
            </Card.Body>
          </Card>
        </div>

        {/* Existing Splits */}
        <h6 className="mb-3">Current Split Ratios</h6>
        {editingSplits.length === 0 ? (
          <Alert variant="info">No split ratios defined. Add one below.</Alert>
        ) : (
          editingSplits.map((split, index) => {
            const validation = validateSplit(split.value);
            return (
              <div key={index} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Form.Group className="flex-grow-1 me-2">
                    <Form.Label>Split Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingSplits[index].name}
                      disabled
                      onChange={(e) => {
                        handleSplitNameChange(index, e.target.value);
                        setTimeout(() => onSplitsUpdate(editingSplits), 0);
                      }}
                      placeholder="Enter split name"
                      autoFocus
                    />
                  </Form.Group>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      handleDeleteSplit(index);
                      setTimeout(() => onSplitsUpdate(editingSplits.filter((_, i) => i !== index)), 0);
                    }}
                    className="mt-4"
                    title="Delete this split"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
                <Form.Group>
                  <Form.Label>Percentages</Form.Label>
                  <Form.Control
                    type="text"
                    value={editingSplits[index].value.join(', ')}
                    disabled
                    onChange={(e) => {
                      handleSplitValueChange(index, e.target.value);
                      setTimeout(() => onSplitsUpdate(editingSplits), 0);
                    }}
                    placeholder="e.g., 50, 30, 20 or 50 30 20 or 50-30-20"
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <Form.Text className="text-muted">
                      Current sum: <strong>{validation.sum}%</strong>
                      {validation.remaining !== 0 && (
                        <span className={validation.remaining > 0 ? 'text-warning' : 'text-danger'}>
                          {' '} | Remaining: <strong>{validation.remaining}%</strong>
                        </span>
                      )}
                    </Form.Text>
                    <Badge bg={validation.isValid ? 'success' : 'danger'}>
                      {validation.isValid ? '✓ Valid' : '✗ Invalid'}
                    </Badge>
                  </div>
                </Form.Group>
              </div>
            );
          })
        )}

        {/* Add New Split */}
        <hr />
        <h6 className="mb-3">Add New Split Ratio</h6>
        <Form.Group className="mb-3">
          <Form.Label>Split Name</Form.Label>
          <Form.Control
            type="text"
            value={newSplitName}
            onChange={(e) => setNewSplitName(e.target.value)}
            placeholder="e.g., 60-30-10 or Custom Split"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Percentages</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={newSplitValues}
              onChange={(e) => setNewSplitValues(e.target.value)}
              placeholder="e.g., 60, 30, 10 or 60 30 10 or 60-30-10"
            />
            <Button
              variant="outline-primary"
              onClick={() => {
                handleAddSplit();
                // Auto-save on add
                setTimeout(() => onSplitsUpdate([...editingSplits, {
                  name: newSplitName,
                  value: parseValues(newSplitValues),
                  isCustom: true
                }]), 0);
              }}
              disabled={!newSplitName.trim() || !newSplitValues.trim()}
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </Button>
          </InputGroup>
          {newSplitValues && (
            <div className="d-flex justify-content-between align-items-center mt-1">
              <Form.Text className="text-muted">
                Preview sum: <strong>{newSplitValidation.sum}%</strong>
                {newSplitValidation.remaining !== 0 && (
                  <span className={newSplitValidation.remaining > 0 ? 'text-warning' : 'text-danger'}>
                    {' '} | Remaining: <strong>{newSplitValidation.remaining}%</strong>
                  </span>
                )}
              </Form.Text>
              <Badge bg={newSplitValidation.isValid ? 'success' : 'danger'}>
                {newSplitValidation.isValid ? '✓ Valid' : '✗ Invalid'}
              </Badge>
            </div>
          )}
          <Form.Text className="text-muted">
            Enter percentages separated by commas, spaces, or hyphens. They must sum to exactly 100%.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button variant="outline-danger" onClick={handleReset}>
            Reset
          </Button>
        </div>

        <div>
          <Button variant="secondary" onClick={onHide} className="me-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
