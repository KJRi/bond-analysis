// @flow
import React from 'react'
import styles from './TargetComponent.css'
import { Layout, Button, Input, Table, DatePicker, Modal, Radio, Select, Icon, message, Popconfirm, Pagination, Row, Col, Collapse } from 'antd'
import moment from 'moment'
import EditableCell from 'components/EditableCell'
import Scrollbars from 'react-custom-scrollbars'
const RadioGroup = Radio.Group
const { Sider, Content, Footer, Header  } = Layout;
const { Option } = Select
const { TextArea } = Input
const { Panel } = Collapse

const optionData = [
  {
    label : '全部债券',
    value : '$1'
  }, {
    label : '我的关注',
    value : '$2'
  }, {
    label : '半小时截标',
    value : '$3'
  }
]

const modalColumns = [
  {
    title: '债券名称',
    dataIndex: 'bondname',
    key: 'bondname',
  },
  {
    title: '标量',
    dataIndex: 'bl',
    key: 'bl',
  },
  {
    title: '标位',
    dataIndex: 'bw',
    key: 'bw',
  },
  {
    title: '客户',
    dataIndex: 'cust',
    key: 'cust',
  },
  {
    title: '交易员',
    dataIndex: 'operator',
    key: 'operator',
  },
]

function myreplaceStr(str){
  var mystr = "            " ; 
  return str + mystr.substr(str.length-1 , 12) ; 
}

function copyToClipboard(txt) {
  var textarea = document.createElement("textarea");
  textarea.value = txt;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function groupBy(array, f) {
  let groups = {}
  array.forEach((o) => {
      let group = JSON.stringify(f(o))
      groups[group] = groups[group] || []
      groups[group].push(o)
  })
  return Object.keys(groups).map((group) => {
      return groups[group]
  })
}

class TargetComponent extends React.PureComponent {
  constructor (props) {
    super(props)
  }
  state = {
    processData: [],
    textValue: '',
    dateValue: moment(),
    modalState: false,
    operatorData: [],
    selectedRowKeys: [],
    resultData: [],
    selectValue: '$1',
    searchValue: '',
    current: 1,
    total: 0,
    bondData: [],
    activeKey: [],
    refreshList: [],
    pageSize: 10,
    collapseState: false,
  }

  componentDidMount () {
    this.getOperator()
    this.handleSearch()
  }

  hasCookie = () => {
    const cookie = document.cookie
    if (cookie.indexOf('cookids=') === -1) {
      message.destroy()
      message.error('登录已过期 ，请重新登录')
      this.props.history.push('/login')
      return
    }
  }

  getOperator = () => {
    fetch(`${__API__}getOperators`, {
      method: 'GET',
      credentials: 'include',
    }).then(res => res.json())
    .then(result => {
      this.setState({
        operatorData: result,
      })
    })
    .catch(error => console.log('error', error));
  }

  onCellChange = (key, dataIndex) => {
    return (value) => {
      const processData = [...this.state.processData];
      const target = processData.find(item => item.key === key);
      if (target) {
        if (dataIndex === 'operatorID') {
          const obj = this.state.operatorData.find(item => item.operatorID === value)
          target['operator'] = obj.operator;
        }
        target[dataIndex] = value;
        this.setState({ processData });
      }
    };
  }

  onResultCellChange = (obj, dataIndex) => {
    return (value) => {
      const resultData = [...this.state.resultData];
      const target = resultData.find(item => item.bondnameID === obj.bondnameID).childArr[obj.key];
      if (target) {
        if (dataIndex === 'operatorID') {
          const obj = this.state.operatorData.find(item => item.operatorID === value)
          target['operator'] = obj.operator;
        }
        target[dataIndex] = value;
        target['changeState'] = true
        this.setState({ resultData });
      }
    };
  }

  handleProcess = () => {
    this.hasCookie()
    const { textValue, dateValue } = this.state
    var urlencoded = new URLSearchParams();
    urlencoded.append("context", textValue);
    urlencoded.append("day", moment(dateValue).format('YYYY-MM-DD'));
    fetch(`${__API__}semanticAnalysisByOneMsg`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
      },
      body: urlencoded,
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      this.handleProcessData(result)
    })
    .catch(error => console.log('error', error));
  }

  handleProcessData = (data) => {
    const _this = this
    if (data.length === 0) {
      return
    }
    let findItem = data.find(item => item.matchStr.indexOf('~') !== -1)
    let index = data.findIndex(item => item.matchStr.indexOf('~') !== -1)
    if (index !== -1) {
      const radioStyle = {
        display: 'block',
        height: '20px',
        lineHeight: '20px',
      }
      let radioValue = 0
      let newArr = findItem.matchStr.split('~').map((etem, endex) => {
        return {
          matchStr: etem,
          type: findItem.type.split('~')[endex],
          key: endex,
        }
      })
      let inputValue = newArr[newArr.length - 1].matchStr
      newArr.pop()
      Modal.confirm({
        title: '请选择',
        content: <div>
          <h3>{data.map((etem, endex) => {
            let matchStr = etem.matchStr
            if (matchStr === 'delete') matchStr = '删除'
            if (matchStr === 'update') matchStr = '更新'
            return  endex === index
            ? <span key={endex} style={{ color: 'red' }}>{inputValue} </span>
            : <span>{etem.type !== '原文ID' && matchStr} </span>
          })}</h3>
          <p style={{ color: 'red', marginTop: 20 }}>原文标红处匹配多项信息：请选择</p>
          <RadioGroup defaultValue={0} onChange={e => radioValue = e.target.value }>
            {newArr.map(etem => { return <Radio style={radioStyle} key={etem.key} value={etem.key}>{etem.type === '债券名称' ? '【券名】' : '【客户】'} {etem.matchStr}</Radio> })}
            <Radio style={radioStyle} value={-1}>标红处无信息</Radio>
            <Radio style={radioStyle} value='custom'><Input addonBefore='自定义客户为' defaultValue={inputValue} onChange={e => inputValue = e.target.value } /></Radio>
          </RadioGroup>
        </div>,
        okText: '确认选择',
        cancelText: '关闭',
        onOk() {
          if (radioValue === 'custom') {
            Modal.confirm({
              title: '选择临时客户',
              content: <p>您确定选择临时客户:  <span style={{ color: 'red' }}>{inputValue}</span></p>,
              okText: '确认',
              cancelText: '取消',
              onOk() {
                const newObj = findItem
                Object.assign(newObj, {
                  matchStr: inputValue,
                  type: '机构名称',
                })
                data.splice(index, 1, newObj)
                _this.handleProcessData(data)
              },
            })
          } else if (radioValue === -1) {
            data.splice(index, 1)
            _this.handleProcessData(data)
          } else {
            const newObj = findItem
            Object.assign(newObj, newArr[radioValue])
            data.splice(index, 1, newObj)
            _this.handleProcessData(data)
          }
        },
      })
    } else {
      this.structuredByList(data)
    }
  }

  structuredByList = (data) => {
    const _this = this
    fetch(`${__API__}structuredByList`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.some(item => item.cz === '--')) {
        Modal.info({
          title: '操作补全提示！',
          content: '由于簿记信息中无该客户对此券的投标信息，操作类型自动更正为新增',
          okText: '确定',
        })
      }
      let processData = result
      const newArr = result && result.map((item, index) => {
        const str = ''
        return {
          key: index,
          str: str.concat(item.bondname, item.bl, item.bw, item.cust, item.operator,item.cz, item.note)
        }
      })
      const noBlArr = result && result.map((item, index) => {
        const str = ''
        return {
          key: index,
          str: str.concat(item.bondname, item.bw, item.cust, item.operator,item.cz, item.note)
        }
      })
      if (newArr.length !== this.arraySet(newArr).length) {
        Modal.confirm({
          title: '结果重复提示！',
          content: '有多条相同信息，是否标量合并',
          okText: '确定',
          cancelText: '取消',
          onOk() {
            processData = _this.arraySet(newArr).map(item => {
              let bl = result[item.key].bl
              if (bl !== '-') {
                let num = 0
                result.forEach(etem => {
                if (etem.bondname.concat(etem.bw, etem.bl, etem.cust, etem.operator,etem.cz, etem.note) === result[item.key].bondname.concat(result[item.key].bw, result[item.key].bl, result[item.key].cust, result[item.key].operator,result[item.key].cz, result[item.key].note)) {
                  num++
                }
              })
                bl = num*(parseInt(bl)) + 'W'
              }
              return {
                ...result[item.key],
                bl,
              }
            })
            _this.setState({
              processData: processData && processData.map((item, index) => {
                return {
                  ...item,
                  key: index,
                  cz: item.cz === '-' || item.cz === '--' ? 'new' : item.cz,
                }
              }),
              selectedRowKeys: processData && processData.map((item, index) => {
                return index
              }),
            }, () => _this.searchSelectList())
          },
          onCancel() {
            processData = _this.arraySet(newArr).map(item => {
              return {
                ...result[item.key],
              }
            })
            _this.setState({
              processData: processData && processData.map((item, index) => {
                return {
                  ...item,
                  key: index,
                  cz: item.cz === '-' || item.cz === '--' ? 'new' : item.cz,
                }
              }),
              selectedRowKeys: processData && processData.map((item, index) => {
                return index
              }),
            }, () => _this.searchSelectList())
          },
        })
      } else if (noBlArr.length !== this.arraySet(noBlArr).length) {
        Modal.confirm({
          title: '相同标位合并提示',
          content: '同一标位上有多个投标，是否合并投标量?',
          okText: '确定',
          cancelText: '取消',
          onOk() {
            processData = _this.arraySet(noBlArr).map(item => {
              let num = 0
              result.forEach(etem => {
                if (etem.bl !== '-' && etem.bondname.concat(etem.bw, etem.cust, etem.operator,etem.cz, etem.note) === result[item.key].bondname.concat(result[item.key].bw, result[item.key].cust, result[item.key].operator,result[item.key].cz, result[item.key].note)) {
                  num += parseInt(etem.bl)
              }
              })
              return {
                ...result[item.key],
                bl: num + 'W',
              }
            })
            _this.setState({
              processData: processData && processData.map((item, index) => {
                return {
                  ...item,
                  key: index,
                  cz: item.cz === '-' || item.cz === '--' ? 'new' : item.cz,
                }
              }),
              selectedRowKeys: processData && processData.map((item, index) => {
                return index
              }),
            }, () => _this.searchSelectList())
          },
          onCancel() {
            _this.setState({
              processData: processData && processData.map((item, index) => {
                return {
                  ...item,
                  key: index,
                  cz: item.cz === '-' || item.cz === '--' ? 'new' : item.cz,
                }
              }),
              selectedRowKeys: processData && processData.map((item, index) => {
                return index
              }),
            }, () => _this.searchSelectList())
          },
        })
      } else {
        this.setState({
          processData: result && result.map((item, index) => {
            return {
              ...item,
              key: index,
              cz: item.cz === '-' || item.cz === '--' ? 'new' : item.cz,
            }
          }),
          selectedRowKeys: processData && processData.map((item, index) => {
            return index
          }),
        }, () => this.searchSelectList())
      }
    })
    .catch(error => console.log('error', error));
  }

  submitDatabase = () => {
    this.hasCookie()
    const { processData, selectedRowKeys, dateValue } = this.state
    const newList = []
    selectedRowKeys.forEach(item => {
      newList.push(Object.assign(processData[item], { day: moment(dateValue).format('YYYY-MM-DD') }))
    })
    if (newList.length === 0) {
      message.destroy()
      message.error('请最少选择一条数据')
      return
    }
    let isTrue = true
    newList.forEach(item => {
      if (item.bondname.length === 0 || item.bondname === '-') {
        message.destroy()
        message.error('券名不能为空！')
        isTrue = false
        return
      }
      if (item.cz !== 'delete') {
        if (item.bl.length === 0 || item.bl === '-') {
          message.destroy()
          message.error('非撤标操作，标量不能为空！')
          isTrue = false
          return
        }
        if (item.bw.length === 0 || item.bw === '-') {
          message.destroy()
          message.error('非撤标操作，标位不能为空！')
          isTrue = false
          return
        }
        if (item.cust.length === 0 || item.cust === '-') {
          message.destroy()
          message.error('非撤标操作，客户名称不能为空！')
          isTrue = false
          return
        }
        if (item.operator.length === 0 || item.operator === '-') {
          message.destroy()
          message.error('非撤标操作，交易员不能为空！')
          isTrue = false
          return
        }
      }
    })
    if (isTrue) {
      this.verificationSection(newList)
    }
  }

  verificationSection = (newList) => {
    const _this = this
    fetch(`${__API__}verificationSection`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(newList),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.length !== 0) {
        const res = result[0]
        if (res.isSuccess === '1') {
          Modal.confirm({
            title: '标位越界提示',
            content: <div>{
              result.map((item, index) => {
                return <div dangerouslySetInnerHTML={{__html: item.msg }} key={index} />
              })}</div>,
            okText: '确定',
            cancelText: '取消',
            onOk() {
              _this.insertResult(newList)
            },
          })
        } else if (res.isSuccess === '-1') {
          Modal.error({
            title: '非法数据验证',
            content: <div>{
              result.map((item, index) => {
                return <div dangerouslySetInnerHTML={{__html: item.msg }} key={index} />
              })}</div>,
            okText: '确定',
          })
        } 
      } else {
        this.insertResult(newList)
      }
    })
    .catch(error => console.log('error', error));
  }

  insertResult = (data) => {
    fetch(`${__API__}insert_jx_result`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.isSuccess === '1') {
        this.catchResult(data)
      } else if (result.isSuccess === '-1') {
        Modal.error({
          content: result.msg,
          okText: '确定',
        })
      }
    })
    .catch(error => console.log('error', error));
  }

  async catchResult(newList) {
    const _this = this
    const updataList = newList.filter(item => { return item.cz === 'update' })
    const insertList = newList.filter(item => { return item.cz === 'new' })
    const deleteList = newList.filter(item => { return item.cz === 'delete' })
    const newArr = []
    let newUpdateLIst = groupBy(updataList, (item => {
      return [item.bondnameID + item.custID + item.operatorID]
    }))
    newUpdateLIst.length !== 0 && newUpdateLIst.forEach(item => {
      newArr.push(this.isAlertWindows(item))
    })
    insertList.length !== 0 && insertList.forEach(item => {
      newArr.push(this.isAlertWindows([item]))
    })
    deleteList.length !== 0 && deleteList.forEach(item => {
      newArr.push(this.isAlertWindows([item]))
    })
    await Promise.all(newArr).then(res => {
      const arr = res.filter(item => { return item !== '' && item !== undefined })
      if (arr.length !== 0) {
        Modal.success({
          content: arr.map((item, index) => {
            return <p dangerouslySetInnerHTML={{__html: item }} key={index}/>
          }),
          okText: '确定',
          onOk() {
            _this.searchSelectList()
          }
        })
      }
    }, error => {
      console.log('error', error)
    })
  }

  async isAlertWindows(data) {
    const _this = this
    return await fetch(`${__API__}isAlertWindows`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.length !== 0) {
        const res = result[0]
        if (res.isSuccess === '-2') {
          return new Promise((resolve, reject) => {
            const modal = Modal.confirm({
              title: '重复数据校验',
              content: <div>
                <p>{res.msg}</p>
                <Button size='large' style={{position:'absolute',right:'153px',top:'125px'}} onClick={() => modal.destroy()} >取消</Button>
              </div>,
              okText: '是',
              cancelText: '否',
              onOk() {
                const obj = data.map(item => {
                  return {
                    ...item,
                    tradesn: res.tradesn,
                    bl: 2*(parseInt(item.bl)) + 'W',
                    cz: 'update',
                  }
                })
                resolve(_this.saveInsert(obj))
              },
              onCancel() {
                resolve(_this.saveInsert(data))
              },
            })
          })
        } else if (res.isSuccess === '2') {
          const datas = res.datas
          if (datas.length === 0) {
            return res.msg
          } else {
            return new Promise((resolve, reject) => {
              Modal.success({
              title: '入库成功提示',
              content: <div>
                <p dangerouslySetInnerHTML={{__html: res.msg }} />
                <p style={{ color: 'red' }}>数据库中还有数据需要您确认是否删除？</p>
              </div>,
              okText: '确定',
              onOk() {
                let arr = datas
                Modal.confirm({
                  title: '请选择需要删除的信息',
                  width: 700,
                  content: <div>
                    <Table
                    columns={modalColumns}
                    dataSource={datas}
                    pagination={false}
                    rowKey="tradesn"
                    rowSelection={{
                      type: 'checkbox',
                      getCheckboxProps(record) {
                        return {
                          defaultChecked: record.tradesn
                        }
                      },
                      onChange: (selectedRowKeys, selectedRows) => {
                        arr = selectedRows
                      }
                    }} />
                  </div>,
                  okText: '删除选中数据',
                  cancelText: '不删除数据',
                  onOk() {
                    arr.forEach(item => {
                      Object.assign(item, { cz: 'delete', day: moment(_this.state.dateValue).format('YYYY-MM-DD') })
                    })
                    resolve(_this.saveDelete(arr, res.msg))
                  },
                  onCancel() {
                    resolve(res.msg)
                  },
                })
              },
            })
          })
         }
        } else if (res.isSuccess === '1') {
          const datas = res.datas
          if ((parseInt(data[0].bl) === parseInt(datas[0].bl) && data[0].bw === datas[0].bw && (data[0].note === '-' || data[0].note === '' || data[0].note === datas[0].note))) {
            return new Promise((resolve, reject) => {
              Modal.info({
                title: '入库提示',
                content: <div>
                <p>券名:{datas[0].bondname} 客户:{datas[0].cust} 标量:{data[0].bl} 标位:{data[0].bw}</p>
                <p>与数据库数据完全相同，无需修改！！</p>
              </div>,
                okText: '是',
                onOk() {
                  resolve('')
                },
              })
            })
          } else {
            return new Promise((resolve, reject) => {
              Modal.confirm({
                title: '入库提示',
                content: <div><p>是否将 {datas[0].bondname} {datas[0].cust}</p>
                { parseInt(data[0].bl) !== parseInt(datas[0].bl) && <p>【标量】{datas[0].bl}修改为：{data[0].bl}</p> }
                { data[0].bw !== datas[0].bw && <p>【标位】{datas[0].bw}修改为：{data[0].bw}</p> }
                { data[0].note !== '' && data[0].note !== '-' && (data[0].note !== datas[0].note) && <p>【备注】{datas[0].note}修改为：{data[0].note}</p> }</div>,
                okText: '是',
                cancelText: '否',
                onOk() {
                  Object.assign(data[0], { tradesn: datas[0].tradesn })
                  if (data[0].note === '' || data[0].note === '-') Object.assign(data[0], { note: datas[0].note })
                  console.log(_this.saveInsert(data))
                  resolve(_this.saveInsert(data))
                },
              })
            })
          }
        } else if (res.isSuccess === '-1') {
          Modal.error({
            title: res.msg,
          })
          return ''
        }
      } else {
        return this.saveInsert(data)
      }
    })
    .catch(error => console.log('error', error));
  }

  async saveInsert(data) {
    return await fetch(`${__API__}save_bj_other`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      const res = result[0]
      if (res.isSuccess === '1') {
        return res.msg
      } else if (res.isSuccess === '-1') {
        return res.msg
      }
    })
    .catch(error => console.log('error', error));
  }

  async saveDelete(data, str) {
    return await fetch(`${__API__}save_bj_sel`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      return str + result.msg
    })
    .catch(error => console.log('error', error));
  }

  editRemark = (item) => {
    this.hasCookie()
    const _this = this
    let remark = item.remark
    Modal.confirm({
      title: '请输入备注',
      content: <div>
        <TextArea rows={10} defaultValue={remark} onChange={(e) => remark = e.target.value } />
      </div>,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        let urlencoded = new URLSearchParams();
        urlencoded.append("bondnameID", item.bondnameID);
        urlencoded.append("remark", remark);
        fetch(`${__API__}updateRemark`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
          },
          body: urlencoded,
          redirect: 'follow'
        }).then(res => res.json())
        .then(result => {
          message.success('更新成功')
          _this.handleSearch()
        })
        .catch(error => console.log('error', error));
      },
    })
  }

  handleRefresh = () => {
    this.semanticAnalysisForBondInfo(this.state.refreshList)
  }

  handleFollow = (type) => {
    const _this = this
    const { refreshList } = this.state
    Modal.confirm({
      title: type === 'cancel' ? '一键取消关注确认' : '一键关注确认',
      content: type === 'cancel' ? '您确定要取消关注簿记结果中所有债券?' : '您确定要关注簿记结果中所有债券?',
      onOk() {
        _this.followItem(refreshList, type)
      }
    })
  }

  searchSelectList = () => {
    const newList = []
    this.state.selectedRowKeys.forEach(item => {
      newList.push(this.state.processData[item].bondnameID)
    })
    this.handleSearch(newList.join(',') + '&bondnameids')
    this.semanticAnalysisForBondInfo(newList.join(','))
  }

  semanticAnalysisForBondInfo = (arr) => {
    this.hasCookie()
    var urlencoded = new URLSearchParams();
    urlencoded.append("bondnameIDs", arr);
    fetch(`${__API__}semanticAnalysisForBondInfo`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
      },
      body: urlencoded,
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      const resultData = result.map(item => {
        return {
          ...item[0],
          childArr: item.map((etem, index) => {
            return {
              ...etem,
              changeState: false,
              clickState: false,
              key: index,
            }
          }),
        }
      })
      this.setState({
        activeKey: resultData.map(item => {
          return item.bondname
        }),
        resultData,
        refreshList: arr,
      })
    })
    .catch(error => console.log('error', error));
  }

  copyResult = () => {
    const { resultData } = this.state
    let copyStr = ''
    resultData.forEach(item => {
      if (item.bondnameID) {
        if (item.basestandard) {
          copyStr += item.bondname + "(基准:" + item.basestandard + ")\n"
          copyStr += myreplaceStr('标位') + myreplaceStr('减基准后')+ myreplaceStr('数量(亿)')+ "\n"
        } else {
          copyStr += item.bondname + "\n"
          copyStr += myreplaceStr('标位') + myreplaceStr('数量(亿)')+ "\n"
        }
        let dataInfo = {}
        item.childArr.forEach(etem => {
          let { bw, state, basestandard } = etem
          if (!dataInfo[bw]) {
            dataInfo[bw] = {
              bw,
              state,
              basestandard,
              childArr: [],
            }
          }
          dataInfo[bw].childArr.push(etem)
        })
        const newArr = Object.values(dataInfo).sort((a, b) => a.bw - b.bw)
        newArr.forEach(etem => {
          if (etem.state === '有效') {
            const newNum = etem.childArr.reduce((num, next) => {
              if (next.state === '有效') {
                return num + Number(next.bl)
              } else {
                return num
              }
            }, 0)
            copyStr += myreplaceStr(parseFloat(etem.bw).toFixed(4))
            if (item.basestandard) copyStr += myreplaceStr(parseFloat(etem.bw - etem.basestandard).toFixed(4)) + "     "
            copyStr += myreplaceStr(parseFloat(newNum).toFixed(4)) + "\n"
          }
        })
        copyStr += "\n"
      }
    })
    copyToClipboard(copyStr)
    message.destroy()
    message.success('已复制到剪切板')
  }

  handleSearch = (params) => {
    const { searchValue, selectValue, current } = this.state
    var urlencoded = new URLSearchParams();
    urlencoded.append("key", params || searchValue);
    if (!(params || searchValue)) {
      urlencoded.append("findConditions", selectValue);
    }
    urlencoded.append("pageSize", 10);
    if(!!params) {
      urlencoded.append("pageNum", 1);
    } else {
      urlencoded.append("pageNum", current);
    }
    fetch(`${__API__}selBondAll`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
      },
      body: urlencoded,
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (!params) {
        let str = ''
        result.data && result.data.forEach(item => {
          str += item.bondnameID + ','
        })
        this.semanticAnalysisForBondInfo(str)
      }
      this.setState({
        bondData: result.data,
        total: Number(result.totleRecords) || 0,
        totalPageNum: result.totlePages || 1,
        current: Number(result.pageNum),
        pageSize: result.data.length > 10 ? result.data.length : 10,
      })
    })
    .catch(error => console.log('error', error));
  }

  followItem = (bondnameIDs, type) => {
    this.hasCookie()
    const { bondData } = this.state
    var urlencoded = new URLSearchParams();
    urlencoded.append("bondnameIDs", bondnameIDs);
    urlencoded.append("attentioninfo", type);
    fetch(`${__API__}attention`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
      },
      body: urlencoded,
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.isSuccess === '1') {
        const str = type === 'cancel' ? '取消关注成功' : '关注成功'
        message.success(str)
        let obj
        if (bondnameIDs.indexOf(',') === -1) {
          obj = bondData.map(item => {
            if (item.bondnameID === bondnameIDs) {
              return Object.assign(item, { attention: type === 'cancel' ? '0' : '1' })
            } else {
              return item
            }
          })
        } else {
          obj = bondData.map(item => { return Object.assign(item, { attention: type === 'cancel' ? '0' : '1' }) })
        }
        this.setState({
          bondData: obj,
        })
        this.semanticAnalysisForBondInfo(bondnameIDs)
      }
    })
    .catch(error => console.log('error', error));
  }
  
  updateItem = (item, str) => {
    this.hasCookie()
    Object.assign(item, { cz: str, day: moment(this.state.dateValue).format('YYYY-MM-DD') })
    fetch(`${__API__}updateBJ`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify(item),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.isSuccess === '1') {
        message.destroy()
        message.success(result.msg)
        this.handleRefresh()
      } else {
        Modal.error({
          title: result.msg,
        })
      }
    })
  }

  recoverItem = (item) => {
    this.hasCookie()
    Object.assign(item, { cz: 'recover', day: moment(this.state.dateValue).format('YYYY-MM-DD') })
    fetch(`${__API__}recoverBJ`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify(item),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.isSuccess === '1') {
        message.success(result.msg)
        this.handleRefresh()
      }
    })
  }

  arraySet = (arr) => {
    let obj = {}
    arr = arr.reduce((item, next) => {
      obj[next.str] ? '' : obj[next.str] = true && item.push(next)
      return item;
    }, [])
    return arr
  }

  matchRowSelection = (item) => {
    if (item.state === '有效') {
      if (item.clickState) {
        return styles['click-row']
      } else {
        return ''
      }
    } else {
      return styles['disable-line']
    }
  }

  rowClick = (obj) => {
    const resultData = [...this.state.resultData]
    const target = resultData.find(item => item.bondnameID === obj.bondnameID).childArr[obj.key]
    if (target) {
      target['clickState'] = !target['clickState']
      this.setState({ resultData });
    }
  }

  collapseSider = () => {
    this.setState({
      collapseState: !this.state.collapseState,
    })
  }

  render () {
    const { pageSize, processData, activeKey, textValue, selectedRowKeys, resultData, selectValue, collapseState, operatorData, totalPageNum, searchValue, bondData, total, current} = this.state
    const columns = [{
      title: '债券名称',
      dataIndex: 'bondname',
      key: 'bondname',
    }, {
      title: '标位',
      dataIndex: 'bw',
      key: 'bw',
      render: (text, record) => (
        <EditableCell
          value={text}
          onChange={this.onCellChange(record.key, 'bw')}
        />
      ),
    }, {
      title: '标量',
      dataIndex: 'bl',
      key: 'bl',
      render: (text, record) => (
        <EditableCell
          value={text}
          onChange={this.onCellChange(record.key, 'bl')}
        />
      ),
    },{
      title: '客户',
      dataIndex: 'cust',
      key: 'cust',
      render: (text, record) => (
        <EditableCell
          value={text}
          onChange={this.onCellChange(record.key, 'cust')}
        />
      ),
    }, {
      title: '交易员',
      dataIndex: 'operator',
      key: 'operator',
      render: (text, record) => (
        <Select dropdownMatchSelectWidth={false} value={text} onChange={this.onCellChange(record.key, 'operatorID')}>
          {operatorData && operatorData.map(item => {
            return <Option key={item.operatorID} value={item.operatorID}>{item.operator}</Option>
          })}
        </Select>
      ),
    }, {
      title: '操作',
      dataIndex: 'cz',
      key: 'cz',
      render: (text, record) => (
        <Select value={text} onChange={this.onCellChange(record.key, 'cz')}>
          <Option value='new' >新增</Option>
          <Option value='update' >更新</Option>
          <Option value='delete' >删除</Option>
        </Select>
      ),
    }, {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      render: (text, record) => (
        <EditableCell
          value={text}
          onChange={this.onCellChange(record.key, 'note')}
        />
      ),
    }]
    const resultColumns = [{
      title: '标位',
      dataIndex: 'bw',
      key: 'bw',
      sorter: (a, b) => a.state === '有效' && (a.bw - b.bw),
      render: (text, record) => (
        <EditableCell
          value={text}
          disabled={record.state !== '有效'}
          onChange={this.onResultCellChange(record, 'bw')}
        />
      ),
    }, {
      title: '标量(亿元)',
      dataIndex: 'bl',
      key: 'bl',
      sorter: (a, b) => a.state === '有效' && (a.bl - b.bl),
      render: (text, record) => (
        <EditableCell
          value={text}
          disabled={record.state !== '有效'}
          onChange={this.onResultCellChange(record, 'bl')}
        />
      ),
    }, {
      title: '交易员',
      dataIndex: 'operator',
      key: 'operator',
      sorter: (a, b) => a.state === '有效' && a.operatorID - b.operatorID,
      render: (text, record) => (
        <Select disabled={record.state !== '有效'} dropdownMatchSelectWidth={false} value={text} onChange={this.onResultCellChange(record, 'operatorID')}>
          {operatorData && operatorData.map(item => {
            return <Option key={item.operatorID} value={item.operatorID}>{item.operator}</Option>
          })}
        </Select>
      ),
    },{
      title: '客户',
      dataIndex: 'cust',
      key: 'cust',
      sorter: (a, b) => a.state === '有效' && a.cust.localeCompare(b.cust),
      render: (text, record) => (
        <EditableCell
          value={text}
          disabled={record.state !== '有效'}
          onChange={this.onResultCellChange(record, 'cust')}
        />
      ),
    }, {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      render: (text, record) => (
        <EditableCell
          value={text}
          disabled={record.state !== '有效'}
          onChange={this.onResultCellChange(record, 'note')}
        />
      ),
    }, {
      title: '占发行量比',
      dataIndex: 'circulation',
      key: 'circulation',
      render: (text, record) => (
      <span>{text ? Math.ceil(record.bl/text * 100) : '数据不全'}</span>
      ),
    }, {
      title: '操作类型',
      dataIndex: 'cz',
      key: 'cz',
      render: (text, record) => (
      <span>{
        record.state === '有效'
        ? <span>
          {
            record.changeState
            ? <span
            className={styles['opeate-item']}
            style={{ marginRight: 10 }}
            onClick={() => this.updateItem(record, 'update')} >保存</span>
            : <span style={{ marginRight: 10, color: '#e8e8e8' }}>保存</span>
          }
          <Popconfirm
          title="确认删除吗？"
          onConfirm={() => this.updateItem(record, 'del')}
          okText='是'
          cancelText='否'
          >
            <span className={styles['opeate-item']}>删除</span>
          </Popconfirm>
        </span>
        : <Popconfirm
        title="确认恢复吗？"
        onConfirm={() => this.recoverItem(record)}
        okText='是'
        cancelText='否'
        >
          <span className={styles['opeate-item']}>恢复</span>
        </Popconfirm>
        }</span>
      )
    }, {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
    }, {
      title: '方式',
      dataIndex: 'fs',
      key: 'fs',
    }, {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    }]
    const rowSelection = {
      type: 'checkbox',
      selectedRowKeys,
      onChange: (selectedRowKeys) => {
        this.setState({
          selectedRowKeys,
        })
      }
    }
    const selectBefore = (
      <Select value={selectValue} onChange={e => this.setState({ selectValue: e, searchValue: '', current: 1 }, () => this.handleSearch())} >
        { optionData.map(item => <Option key={item.value} value={item.value}>{item.label}</Option>) }
      </Select>
    )
    return (
        <Layout className={styles['container']}>
          <Content style={{ borderRadius: 10, marginRight: 8 }} className={styles['text-area']}>
            <Scrollbars autoHide>
              <Layout>
                <Sider width={300} className={styles['text-area']}>
                  <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                    <h3>粘贴框</h3>
                    <div>
                    <Button type='primary' onClick={() => this.setState({ textValue: '' })} style={{ marginRight: 10 }}>一键清除</Button>
                    <Button type='primary' onClick={this.handleProcess}>语义解析</Button>
                    </div>
                  </div>
                  <TextArea rows={10} value={textValue} onChange={(e) => this.setState({ textValue: e.target.value })} />
                </Sider>
                <Content className={styles['text-area']}>
                  <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                    <h3>解析框</h3>
                    <Button type='primary' onClick={this.submitDatabase}>提交入库</Button>
                  </div>
                  <Scrollbars autoHide style={{ height: 190, backgroundColor: '#fff' }}>
                    <Table size="middle" style={{ backgroundColor: '#FFF' }} columns={columns} dataSource={processData} pagination={false} rowSelection={rowSelection} scroll={{ x: 'max-content' }} />
                  </Scrollbars>
                </Content>
              </Layout>
              <Footer className={styles['text-area']}>
                <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                  <h3>薄记结果</h3>
                  <div>
                    <Button type='primary' style={{ marginRight: 10 }} onClick={this.handleRefresh}>刷新</Button>
                    <Button type='primary' style={{ marginRight: 10 }} onClick={() => this.handleFollow('confirm')}>一键关注</Button>
                    <Button type='primary' style={{ marginRight: 10 }} onClick={() => this.handleFollow('cancel')}>一键取消关注</Button>
                    <Button type='primary' onClick={this.copyResult}>复制薄记结果</Button>
                  </div>
                </div>
                <Collapse activeKey={activeKey} onChange={(e) => this.setState({ activeKey: e })}>
                  {
                    resultData && resultData.map(item => {
                      return <Panel header={<span>{
                        item.attention === '1'
                        ? <Icon style={{ color: '#ee9b1f', fontSize: 12 }} type="star" />
                        : <Icon style={{ color: '#707070', fontSize: 12 }} type="star-o" />
                      }{item.bondname}&emsp;
                      区间:{item.bidstartvalue && item.bidendvalue ? `[ ${item.bidstartvalue} , ${item.bidendvalue} ]` : '数据库中区间不全' }&emsp;
                      {item.expectation ? `强烈预期:[ ${item.expectation} ] ` : null}
                      {item.circulation_sx ? `发行量上限(亿):[ ${item.circulation_sx} ] ` : null}
                      {item.circulation ? `发行量(亿):[ ${item.circulation} ]  ` : null}
                      {item.specialperiod ? `期限:[ ${item.specialperiod} ]  ` : null}
                      {item.basestandard ? `基准:[ ${item.basestandard} ] ` : null}
                      </span>} key={item.bondname} >
                        {
                          item.bondnameID
                          ? <Table size="middle" style={{ backgroundColor: '#FFF' }} columns={resultColumns}
                          dataSource={item.childArr} rowClassName={this.matchRowSelection}
                          onRowClick={this.rowClick}
                          pagination={false} scroll={{ x: 'max-content' }} />
                          : <div style={{ textAlign: 'center' }} ><p style={{ color: 'red' }}>暂无债券信息</p></div>
                        }
                      </Panel>
                    })
                  }
                </Collapse>
              </Footer>
            </Scrollbars>
          </Content>
          {
            collapseState ? <Button className={styles['fix-btn']} size="small" onClick={this.collapseSider} ><Icon type="left" /></Button>
            :<Sider style={{ borderRadius: 10, padding: 8 }} width={400} className={styles['text-area']}>
            <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 8 }}>
              <Input
                addonBefore={selectBefore}
                style={{ marginRight: 10 }}
                value={searchValue}
                onPressEnter={() => this.setState({
                  current: 1,
                }, () => this.handleSearch())}
                onChange={e => this.setState({ searchValue: e.target.value })} />
              <Button type="primary" onClick={() => this.setState({
                current: 1,
              }, () => this.handleSearch())}><Icon type="search" />搜索</Button>
            </div>
            <div className={styles['search-body']}>
              <Scrollbars autoHide>
              {
                bondData && bondData.map(item => {
                  let margindateTime
                  switch (item.margindate_time) {
                    case '3':
                      margindateTime = '截标日期：暂无'
                      break;
                    case '4':
                      margindateTime = '已经截标'
                      break;
                    case '5':
                      margindateTime = '已出结果'
                      break;
                    default:
                      margindateTime = '截标日期 :' + item.margindate_time
                      break;
                  }
                  return <div className={styles['bond-item']} key={item.bondnameID} onClick={() => this.semanticAnalysisForBondInfo(item.bondnameID)}>
                    <Row>
                      <Col span={20}>
                        {
                          item.attention === '1'
                          ? <Icon onClick={() => this.followItem(item.bondnameID, 'cancel')} style={{ color: '#ee9b1f', fontSize: 16 }} type="star" />
                          : <Icon onClick={() => this.followItem(item.bondnameID, 'confirm')} style={{ color: '#707070' ,fontSize: 16 }} type="star-o" />
                        }
                        <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 10 }}>{item.bondname}</span>
                      </Col>
                      <Col span={4}>
                        {
                          item.recNum > 0
                          ? <span className={styles['recNum-item']}>有报价</span>
                          : <span className={styles['noRecNum-item']}>无报价</span>
                        }
                      </Col>
                    </Row>
                    <Row style={{ marginTop: 4 }}>
                      <Col span={12}>
                      <span style={{ fontWeight: 600 }}>{margindateTime}</span>
                      </Col>
                      <Col span={12}>
                        <span style={{ fontWeight: 600 }}>缴款日:</span> {item.paydate}
                      </Col>
                    </Row>
                    <Row style={{ marginTop: 4 }}>
                      <Col span={24}>
                      <span style={{ fontWeight: 600 }}>主承交易员:</span> {item.staffName}
                      </Col>
                    </Row>
                    <Row style={{ marginTop: 4 }}>
                      <Col span={24}>
                        <div onClick={() => this.editRemark(item)}><span style={{ fontWeight: 600 }}>备注：</span>{item.remark}</div>
                      </Col>
                    </Row>
                  </div>
                })
              }
              </Scrollbars>
            </div>
            <div style={{ width: '100%', justifyContent: 'space-between', display: 'flex', marginTop: 8 }}>
              <Button size="small" onClick={this.collapseSider} ><Icon type="right" /></Button>
              <Pagination pageSize={pageSize} showTotal={total => `总记录数: ${total} 当前页：${current}/${totalPageNum}`} current={current} total={total} onChange={(page) => this.setState({ current: page }, () => this.handleSearch())} />
            </div>
          </Sider>
          }
        </Layout>
    )
  }
}

export default TargetComponent
