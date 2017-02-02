import React, { Component, PropTypes } from 'react';
import Form from './Form';
import DefaultWizardFooter from './WizardFooter';

export default class WizardStep extends Component {
  constructor(props) {
    super(props);
    this.handleGoBack = this.handleGoBack.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(formData, cb) {
    cb();
    this.props.goNext(formData);
  }

  handleGoBack(e) {
    e.preventDefault();
    this.props.goBack();
  }

  render() {
    const {
      className,
      nextButtonText,
      backButtonText,
      stepState,
      isFirst,
      isLast,
      store,
      errorText,
      wizardFooter,
      wizardHeader,
      backButtonClassName,
      nextButtonClassName,
    } = this.props;
    return (
      <Form
        wizardStep
        key={store}
        onSubmit={this.handleSubmit}
        initialState={stepState}
        className={className}
        store={store}
        errorText={errorText}
        noSubmitButton
      >
        {wizardHeader}
        {this.props.children}
        { wizardFooter ||
          <DefaultWizardFooter
            nextButtonText={nextButtonText}
            backButtonText={backButtonText}
            showBackButton={!isFirst}
            showNextButton={!isLast}
            handleGoBack={this.handleGoBack}
            backButtonClassName={backButtonClassName}
            nextButtonClassName={nextButtonClassName}
          /> }
      </Form>
    );
  }
}

WizardStep.propTypes = {
  goBack: PropTypes.func,
  goNext: PropTypes.func,
  className: PropTypes.string,
  nextButtonText: PropTypes.string,
  backButtonText: PropTypes.string,
  backButtonClassName: PropTypes.string,
  nextButtonClassName: PropTypes.string,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  store: PropTypes.string,
  stepState: PropTypes.object,
  errorText: PropTypes.string,
  children: PropTypes.node,
  wizardHeader: PropTypes.object,
  wizardFooter: PropTypes.object,
};

WizardStep.defaultProps = {
  nextButtonText: 'Neste',
  backButtonText: 'Tilbake',
  className: 'wizard__step',
};
