import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Validator from 'nocms-validation';
import utils from 'nocms-utils';
import stores from 'nocms-stores';
import Input from './Input';
import Select from './Select';
import Checkbox from './Checkbox';
import Hidden from './Hidden';
import RadioButtons from './RadioButtons';
import TextArea from './TextArea';
import MultipleCheckbox from './MultipleCheckbox';

class Field extends Component {
  constructor(props) {
    super(props);
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validate = this.validate.bind(this);
    this.handleEnterKey = this.handleEnterKey.bind(this);
    this.applyExistingStoreValue = this.applyExistingStoreValue.bind(this);
    this.state = {
      value: props.value,
      isValid: true,
      isValidated: false,
      convertDate: props.type === 'date',
      disabled: props.disabled,
    };
  }

  componentWillMount() {
    if (utils.isBrowser()) {
      stores.subscribe(this.context.store, this.handleStoreChange);
      this.applyExistingStoreValue();
    }
  }

  componentWillReceiveProps(props) {
    if (props.disabled !== this.state.disabled) {
      this.setState({ disabled: props.disabled, isValid: true, isValidated: false }, () => {
        this.updateStore(this.state.value, true, false);
      });
    }
  }

  componentWillUnmount() {
    if (utils.isBrowser()) {
      stores.unsubscribe(this.context.store, this.handleStoreChange);
      if (this.props.deleteOnUnmount) {
        const inputState = {};
        inputState[this.props.name] = undefined;
        stores.update(this.context.store, inputState);
      }
    }
  }


  applyExistingStoreValue() {
    const store = stores.getStore(this.context.store);
    const initialState = store[this.props.name];
    const inputState = {};
    inputState[this.props.name] = { isValid: true, isValidated: !this.props.required, validate: this.validate, disabled: this.state.disabled };

    if (typeof initialState === 'undefined' || initialState === null) {
      if (this.props.type === 'text' || this.props.type === 'textarea' || this.props.type === 'hidden' || (this.props.type === 'select' && !this.props.multiple)) {
        inputState[this.props.name].value = this.props.value || '';
      }
    } else if (typeof initialState !== 'object' || initialState instanceof Array) {
      inputState[this.props.name].value = initialState;
    } else {
      inputState[this.props.name] = initialState;
    }

    stores.update(this.context.store, inputState);
  }

  handleDependentState(store, changes) {
    if (!this.props.dependOn) {
      return false;
    }

    const fields = this.props.dependOn.split(',').map(f => f.trim());
    const values = {};

    // Check if any of the changed values are in the dependOn list
    const doUpdate = fields.reduce((val, f) => {
      values[f] = store[f];
      if (changes[f]) {
        return true;
      }
      return val;
    }, false);

    if (!doUpdate) {
      return false;
    }

    const aggregatedValue = this.props.dependencyFunc(values);
    const aggregatedState = { value: aggregatedValue, isValid: true, isValidated: true };

    this.setState(aggregatedState);
    this.updateStore(aggregatedValue, true, true);
    return true;
  }

  handleStoreChange(store, changes) {
    if (this.props.dependOn && this.handleDependentState(store, changes)) {
      return;
    }
    let newState = store[this.props.name];
    if (typeof newState !== 'object') {
      // Upgrade simple data values to input state in store
      newState = {
        value: newState,
        isValid: true,
        isValidated: false,
      };
    }
    this.setState(newState);
  }

  handleChange(e) {
    let value;
    if (this.props.type === 'checkbox') {
      if (this.props.multiple) {
        const oldValue = this.state.value || [];
        if (e.target.checked) {
          value = [...oldValue, e.target.value];
        } else {
          value = oldValue.filter(v => v !== e.target.value);
        }
      } else {
        value = e.currentTarget.checked;
      }
    } else if (this.props.type === 'select' && this.props.multiple) {
      value = [...e.target.options].filter(o => o.selected).map(o => o.value);
    } else {
      value = e.currentTarget.value;
    }
    this.updateStore(value, true, this.state.isValidated);
    if (this.props.onChange) {
      this.props.onChange(e, e.currentTarget.value);
    }
  }

  handleEnterKey(e) {
    if (e.keyCode === 13) { // Enter
      e.preventDefault();
      this.validate();
    }
  }

  updateStore(value, isValid, isValidated) {
    const state = {};
    state[this.props.name] = {
      value,
      isValid,
      isValidated,
      disabled: this.state.disabled,
      validate: this.validate,
      convertDate: this.props.type === 'date',
    };

    stores.update(this.context.store, state);
  }

  validate() {
    if (this.props.disabled) {
      return true;
    }
    if (!this.props.validate && !this.props.required) {
      return true;
    }
    let value = this.state.value;
    if (this.props.type === 'date' && this.props.dateParser) {
      value = this.props.dateParser(value);
    }
    const isValid = Validator.validate(value, this.props.validate, this.props.required);
    this.updateStore(value, isValid, true);
    return isValid;
  }

  render() {
    const { type, options, multiple } = this.props;
    const props = Object.assign({}, this.props, this.state);

    props.handleChange = this.handleChange;
    props.handleKeyDown = this.handleEnterKey;
    props.validate = this.validate;
    props.key = this.props.name;
    if (type === 'hidden') {
      return <Hidden {...props} />;
    }
    if (type === 'radio') {
      return <RadioButtons {...props} />;
    }
    if (type === 'textarea') {
      return <TextArea {...props} />;
    }
    if (type === 'select') {
      return <Select {...props} />;
    }
    if (type === 'checkbox') {
      return options && multiple ? <MultipleCheckbox {...props} /> : <Checkbox {...props} />;
    }
    return <Input {...props} />;
  }
}

Field.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  deleteOnUnmount: PropTypes.bool,
  validate: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  dependOn: PropTypes.string,
  dependencyFunc: PropTypes.func,
  dateParser: PropTypes.func,
  onChange: PropTypes.func,
  multiple: PropTypes.bool,
  options: PropTypes.array,
};

Field.defaultProps = {
  type: 'text',
};

Field.contextTypes = {
  store: PropTypes.string, // we get this from Form.js
};

export default Field;
