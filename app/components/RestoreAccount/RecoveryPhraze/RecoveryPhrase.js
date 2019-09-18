// @flow
import { clipboard, ipcRenderer } from 'electron';
import React, { Component } from 'react';
import Icon from '../../common/Icon/Icon';
import styles from './RecoveryPhraze.css';

type Props = {
  wordsCount: number,
  phrase?: string[],
  readOnly?: boolean,
  onChange?: Function
};

const passPhaseSearchRegex = '(\\d+)\\. ([a-z].*)\\n';

export default class RecoveryPhrase extends Component<Props> {
  props: Props;

  static defaultProps = {
    phrase: [],
    readOnly: false,
    onChange: undefined
  };

  constructor(props) {
    super(props);
    const { phrase } = props;
    this.state = {
      values: phrase
    };
  }

  handleInputChange(event) {
    const { target } = event;
    const { name, value } = target;
    const { values } = this.state;
    const { onChange } = this.props;
    values[name].value = value;

    this.setState({
      values
    });
    if (typeof onChange === 'function') {
      onChange(values);
    }
  }

  renderPhrazeWords() {
    const { wordsCount, phrase, readOnly } = this.props;
    const phraseInputs = [];
    for (let i = 0; i < wordsCount; i += 1) {
      phraseInputs.push(
        <div className={styles.InputContainer} key={i}>
          <span>{i + 1}.</span>
          <input
            value={phrase[i].value}
            readOnly={readOnly}
            name={phrase[i].id}
            onChange={e => this.handleInputChange(e)}
            // onPaste={e => e.preventDefault() || this.paste()}
            autoFocus={i === 0}
            className={styles.Input}
          />
        </div>
      );
    }
    return phraseInputs;
  }

  get formattedPhrase(): string {
    const { phrase } = this.props;
    let result = '';
    phrase.forEach((part, index) => {
      result += `${index + 1}. ${part.value}\n`;
    });
    return result;
  }

  copy() {
    clipboard.writeText(this.formattedPhrase);
  }

  paste() {
    const { wordsCount, onChange } = this.props;
    const clipboardContent = clipboard.readText();
    const regex = RegExp(passPhaseSearchRegex, 'g');
    const values = [];
    let word = regex.exec(clipboardContent);
    if (word === null || word.length !== 3 || parseInt(word[1], 10) !== 1) {
      return;
    }
    do {
      values.push({ id: values.length, value: word[2] });
      word = regex.exec(clipboardContent);
    } while (
      word !== null &&
      values.length < 24 &&
      values.length + 1 === parseInt(word[1], 10) &&
      word.length === 3
    );
    if (values.length !== wordsCount) {
      return;
    }
    this.setState({ values });
    if (typeof onChange === 'function') {
      onChange(values);
    }
  }

  clear() {
    const { onChange } = this.props;
    const { values } = this.state;
    const clearValues = values.map(v => ({ ...v, value: '' }));
    this.setState({ values: clearValues });
    if (typeof onChange === 'function') {
      onChange(clearValues);
    }
  }

  print() {
    ipcRenderer.send('printPDF', this.formattedPhrase);
  }

  render() {
    const { phrase, readOnly } = this.props;
    const notEmpty = !!phrase.map(part => part.value).join('');
    return (
      <div className={styles.Wrapper}>
        <div className={styles.ActionsPanel}>
          {notEmpty && !readOnly && (
            <div
              onClick={() => this.clear()}
              onKeyPress={() => false}
              role="button"
              tabIndex="-1"
              className={styles.Action}
              title="Clear all words"
            >
              <Icon name="clear" color="#fff" size={31} />
            </div>
          )}
          {notEmpty && (
            <div
              onClick={() => this.copy()}
              onKeyPress={() => false}
              role="button"
              tabIndex="-1"
              className={styles.Action}
              title="Copy"
            >
              <Icon name="content_copy" color="#fff" size={31} />
            </div>
          )}
          {false &&
            !readOnly(
              <div
                onClick={() => this.paste()}
                onKeyPress={() => false}
                role="button"
                tabIndex="-1"
                className={styles.Action}
                title="Paste"
              >
                <Icon name="content_paste" color="#fff" size={31} />
              </div>
            )}
          {notEmpty && (
            <div
              onClick={() => this.print()}
              onKeyPress={() => false}
              role="button"
              tabIndex="-1"
              className={styles.Action}
              title="Print"
            >
              <Icon name="print" color="#fff" size={31} />
            </div>
          )}
        </div>
        <div className={`${styles.Container} ScrollBar`}>
          {this.renderPhrazeWords()}
        </div>
      </div>
    );
  }
}
