// @flow
import React, { Component } from 'react'
import styles from './Home.css'
import { Tabs } from 'antd'
import TargetComponent from 'components/TargetComponent'
import TradeComponent from 'components/TradeComponent'
const { TabPane } = Tabs;


class Home extends React.PureComponent {
  constructor (props) {
    super(props)
  }
  state = {
    activeKey: '0',
  }

  changeActiveKey = (e) => {
    this.setState({
      activeKey: e,
    })
  }
 
  render () {
    const { activeKey } = this.state
    return (
        <div className={styles['container']}>
          <Tabs type="card" tabBarExtraContent={<span style={{ color: '#fff', paddingRight: 20 }}>欢迎用户 {sessionStorage.getItem('username')}</span>} activeKey={activeKey} onChange={this.changeActiveKey}>
            <TabPane tab="一级投标解析" key='0' style={{ padding: '0 8px' }}>
              <TargetComponent {...this.props} />
            </TabPane>
            <TabPane disabled tab="二级交易解析" key='1' style={{ padding: '0 8px' }}>
              <TradeComponent {...this.props} />
            </TabPane>
          </Tabs>
        </div>
    )
  }
}

export default Home