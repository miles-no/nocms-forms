import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stores from 'nocms-stores';
import utils from 'nocms-utils';

const getInitialStates = (steps) => {
  if (steps instanceof Array) {
    return steps.map((step) => { return step.initialState || {}; });
  }
  const initialStates = {};
  Object.keys(steps).forEach((stepName) => {
    initialStates[stepName] = steps[stepName].initialState;
  });
  return initialStates;
};

export default class Wizard extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
    this.goNext = this.goNext.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.getFlattenedWizardData = this.getFlattenedWizardData.bind(this);
    this.applyWizardProps = this.applyWizardProps.bind(this);
    this.state = {
      currentStep: props.firstStep || 0,
      lastStep: props.lastStep || props.steps.length - 1,
      wizardData: {},
      initialStates: getInitialStates(props.steps),
    };
  }

  componentWillReceiveProps(props) {
    if (typeof props.currentStep !== 'undefined' && props.currentStep !== this.state.currentStep) {
      this.setState({ currentStep: props.currentStep });
    }
  }

  componentWillUnmount() {
    if (!utils.isBrowser()) {
      return;
    }
    stores.remove(`${this.props.store}*`);
  }

  getStoreForStep(step) {
    return `${this.props.store}-step-${step || this.state.currentStep}`;
  }

  getInitialStateForStep() {
    return this.state.initialStates[this.state.currentStep];
  }

  getStep() {
    const current = this.state.currentStep;
    const step = this.props.steps[current];
    const stepComponent = this.props.steps[current].component;

    return {
      index: current,
      component: this.applyWizardProps(stepComponent),
      store: this.getStoreForStep(),
      initialState: this.state.initialStates[current],
      stepHeader: step.stepHeader,
      stepFooter: step.stepFooter,
      helpArea: step.helpArea,
      overrideSubmit: step.overrideSubmit,
    };
  }

  getBackButton() {
    if (this.state.currentStep === 0 || this.state.currentStep === this.props.firstStep) {
      return null;
    }
    return (<button onClick={this.goBack} className={this.props.backButtonClassName}>
      {this.props.backButtonText}
    </button>);
  }

  getFlattenedWizardData(wizardData) {
    const data = wizardData || this.state.wizardData;
    const flattened = Object.assign.apply(null, [{}].concat(Object.keys(data).map((key) => { return data[key]; })));

    return flattened;
  }

  applyWizardProps(component) {
    const props = {
      store: this.getStoreForStep(),
      goNext: this.goNext,
      handleFinish: this.handleFinish,
      wizardData: this.getFlattenedWizardData(),
      backButton: this.getBackButton(),
      initialState: this.getInitialStateForStep(),
    };
    return React.cloneElement(component, props);
  }

  goBack(e) {
    if (e) {
      e.preventDefault();
    }
    if (this.props.goBack) {
      this.setState({ currentStep: this.props.goBack(this.getFlattenedWizardData(), this.state.currentStep) });
      return;
    }
    this.setState({ currentStep: Math.max(0, this.state.currentStep - 1) });
  }

  goNext(formData) {
    const stepData = Object.assign({}, formData);
    const wizardData = this.state.wizardData;
    wizardData[this.state.currentStep] = stepData;
    this.setState({ wizardData });

    if (this.state.currentStep === this.state.lastStep) {
      this.handleFinish(wizardData);
      return;
    }
    if (this.props.goNext) {
      this.setState({ currentStep: this.props.goNext(this.getFlattenedWizardData(), this.state.currentStep) });
      return;
    }
    if (this.props.steps instanceof Array) {
      this.setState({ currentStep: Math.min(this.props.steps.length - 1, this.state.currentStep + 1) });
      return;
    }
    throw new Error('Named step wizard without goNext override');
  }

  handleFinish(wizardData) {
    this.props.handleFinish(this.getFlattenedWizardData(wizardData), (err) => {
      if (!err) {
        this.setState({ showReceipt: true });
      }
    });
  }

  render() {
    const step = this.getStep();
    return (<div className={this.props.className}>
      { this.state.showReceipt ?
        this.props.receipt(this.getFlattenedWizardData())
        :
        <div>
          { typeof this.state.lastStep === 'number' && this.props.progressIndicator && this.props.progressIndicator(step.index + 1, this.state.lastStep + 1)}
          { step.component }
        </div>
      }
    </div>);
  }
}

Wizard.propTypes = {
  steps: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  firstStep: PropTypes.string,
  lastStep: PropTypes.string,
  store: PropTypes.string,
  currentStep: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  goBack: PropTypes.func,
  goNext: PropTypes.func,
  progressIndicator: PropTypes.func,
  handleFinish: PropTypes.func.isRequired,
  backButtonClassName: PropTypes.string,
  backButtonText: PropTypes.string,
  className: PropTypes.string,
  receipt: PropTypes.func,
};

Wizard.defaultProps = {
  className: 'wizard',
  backButtonText: 'Back',
  backButtonClassName: 'button button__back',
};
