import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.section}>
      <div className={styles.textField}>
        <div className={styles.contents}>
          <div className={styles.aSeparator} />
          <p className={styles.value}>Value</p>
        </div>
        <div className={styles.contents2}>
          <div className={styles.aSeparator} />
          <div className={styles.cursorAndValue}>
            <div className={styles.cursor} />
          </div>
        </div>
        <div className={styles.contents3}>
          <div className={styles.aSeparator} />
          <div className={styles.text}>
            <div className={styles.cursorAndValue2}>
              <p className={styles.value2}>Value</p>
              <div className={styles.cursor} />
            </div>
            <p className={styles.clear}>􀁡</p>
          </div>
        </div>
        <div className={styles.contents4}>
          <div className={styles.aSeparator} />
          <p className={styles.value3}>Value</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
