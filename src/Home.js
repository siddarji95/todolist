import React, { Component } from 'react';
import List from './List';
import Filter from './Filter';
import fire from './fire';
import Loader from 'react-loader-spinner'
import './App.css';
//import Menu from './Menu';

class Home extends Component {
  constructor(props) {
    super(props)
    this.listQueue = [];
    this.state = {
      input: '',
      list: [],
      displayList: [],
      doneTasks: 0,
      showLoader: true,
      filter: null
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleFilterChange = this.handleFilterChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    //this.handleClick = this.handleClick.bind(this)
    this.deleteList = this.deleteList.bind(this)
    this.statusToggle = this.statusToggle.bind(this)
    setTimeout(() => {
      this.setState({ showLoader: false })
    }, 3000);
  }
  componentWillMount() {
    /* Create reference to messages in Firebase Database */
    // if(this.props.email){
    //   fire.database().ref('email').push({email:this.props.email})
    // }

    //Get the current userID
    var userId = fire.auth().currentUser.uid;
    //  console.log(fire.database().ref('users/' + userId))
    fire.database().ref('users/' + userId).on('value', (snapshot) => {
      if (snapshot.val() === null) {
        console.log('siddharth')
        fire.database().ref('users/' + userId).set({
          email: this.props.user.email
        });
      }
    });

    let listRef = fire.database().ref('users/' + userId + '/list').orderByKey().limitToLast(100);
    listRef.on('child_added', snapshot => {
      /* Update React state when message is added at Firebase Database */
      let listvalue = { text: snapshot.val(), id: snapshot.key };
      console.log(this.state.list, "outside", this.listQueue.length)
      this.listQueue.push(listvalue);
      if (this.listQueue.length === 1) {
        this.handleChildAddedQueue()
      }

    })
    listRef.on('child_changed', snapshot => {
      let index = -1;
      this.state.list.forEach((item, i) => {

        if (item.id === Number(snapshot.key)) {
          index = i
        }
      })
      let listValue = { text: snapshot.val(), id: snapshot.key };
      let list = this.state.list
      list[index] = listValue
      const doneTasks = list.filter((item, i) => {
        return item.text.status === 'checked'
      }).length;
      this.setState({
        list: list,
        doneTasks: doneTasks
      });

    })
    listRef.on('child_removed', snapshot => {
      let index = -1;
      this.state.list.forEach((item, i) => {

        if (item.id === Number(snapshot.key)) {
          index = i
        }
      })
      const list = this.state.list.filter((item, i) => {
        return i !== index
      })
      const doneTasks = list.filter((item, i) => {
        return item.text.status === 'checked'
      }).length;
      this.setState({
        list: list,
        doneTasks: doneTasks
      });
    })

  }
  handleChange(e) {
    e.preventDefault();
    this.setState({
      list: this.state.list,
      input: e.target.value
    })
    // console.log(this.state)
  }
  handleChildAddedQueue() {
    const len = this.listQueue.length;
    console.log("handleChildAddedQueue", this.listQueue.length)
    const list = [...this.state.list, ...this.listQueue];
    const doneTasks = list.filter((item, i) => {
      return item.text.status === 'checked'
    }).length;
    this.setState({
      list,
      displayList: list,
      doneTasks: doneTasks,
      showLoader: false
    }, () => {
      this.listQueue.splice(0, len);
      if (this.listQueue.length > 0) {
        this.handleChildAddedQueue();
      }

    });
  }
  changeFilter() {
    let list
    switch (this.state.optionName) {
      case 'done':
        list = this.state.list.filter((item, i) => {
          return item.text.status === 'checked'
        })
        break;
      case 'remaining':
        list = this.state.list.filter((item, i) => {
          return item.text.status !== 'checked'
        })
        break;
      default:
        list = this.state.list
    }
    console.log(list)
    this.setState({
      displayList: list,
    })
  }
  handleFilterChange(e) {
    e.preventDefault();
    const seletedOption = e.target.selectedOptions[0]
    if (!seletedOption) {
      return;
    }
    const optionName = seletedOption.getAttribute('name').toLowerCase();
    this.setState({
      optionName
    }, () => { this.changeFilter(); })
  }
  statusToggle(e) {
    const list = this.state.list;
    let id = e.target.id;
    let currentElement = list.find((item) => {
      return item.id === id;
    });
    if (currentElement.text.status === '')
      currentElement.text.status = 'checked';
    else
      currentElement.text.status = '';

    const doneTasks = list.filter((item, i) => {
      return item.text.status === 'checked'
    }).length;
    this.setState({
      list: list,
      doneTasks: doneTasks
    });
    this.changeFilter()
    var userId = fire.auth().currentUser.uid;
    fire.database().ref('users/' + userId + '/list/' + id).update({ status: currentElement.text.status });
    // console.log(this.state)

  }
  handleSubmit(e) {
    e.preventDefault()
    //rooms.push({roomId:this.state.roomId+1,name:name,messages:messages});
    if (this.state.input !== '') {
      console.log('here')
      this.currentInput = {};
      this.currentInput.name = this.state.input;
      this.currentInput.status = '';
      var today = new Date();
      var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date + ' ' + time;
      this.currentInput.dateTime = dateTime;

      this.setState({
        list: [...this.state.list, this.currentInput],
        input: ''
      });
      var userId = fire.auth().currentUser.uid;
      fire.database().ref('users/' + userId + '/list').push(this.currentInput);
    }
  }
  deleteList(e, index) {
    e.stopPropagation();
    console.log('deleteList')
    let id = e.target.id;
    console.log(id, this.state.list)
    const list = this.state.list.filter((item, i) => {
      return item.id !== id
    })
    const displayList = this.state.displayList.filter((item, i) => {
      return item.id !== id
    })
    const doneTasks = list.filter((item, i) => {
      return item.status === 'checked'
    }).length;
    console.log(list)
    var userId = fire.auth().currentUser.uid;
    fire.database().ref('users/' + userId + '/list/' + id).remove();
    this.setState({
      list: list,
      displayList: displayList,
      doneTasks: doneTasks
    });
  }
  render() {
    return (
      <div className="Home">
        {
          this.props.user.displayName
            ?
            <div className='header'>{this.props.user.displayName.toUpperCase()}</div>
            : <div className='header'>{this.props.user.displayName.toUpperCase()}</div>
        }
        <div className='list'>
          <div id="myDIV" className="header">
            <form onSubmit={this.handleSubmit}>
              <h2 >To Do List</h2>
              <input type="text" id="myInput" placeholder="Add task..." onChange={this.handleChange} value={this.state.input} />
              <input className="addBtn" type="submit" value="Add" />
            </form>
          </div>
          {this.state.showLoader
            ?
            <div className='dataLoader'>
              <Loader
                type="Bars"
                color="#00BFFF"
                height="50"
                width="50"
              />
            </div> :
            this.state.list.length === 0
              ? <h2>No tasks</h2>
              : <React.Fragment>
                <Filter list={this.state.list} handleFilterChange={this.handleFilterChange} />
                <List displayList={this.state.displayList} deleteList={this.deleteList} statusToggle={this.statusToggle} />
              </React.Fragment>
          }
          <div className='donetasks'>Total done task:{this.state.doneTasks}/{this.state.list.length}</div>
        </div>
      </div>
    );
  }
}

export default Home;
