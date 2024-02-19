import React from "react";
import "./search.css";
// auth: "Bearer 1780916|KoGiHUuH4C1obpRcGtVsOuiWVbX3C7rPFbenV6Dg",
class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            results: [],
            keywords: "--",
            section: "--",
            page: 1,
            totalpages: 1,
            enlistments: [],
            auth: "",
            retrieve: false
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.changePage = this.changePage.bind(this);
        this.bookmark = this.bookmark.bind(this);
        this.remove = this.remove.bind(this);
    }

    schedule = async () => {
        // let key = this.state.keywords.replace(" ", "+");
        await fetch(
            `https://api-amis.uplb.edu.ph/api/students/enlistments?enlistment_user_id=e9d86412-93cb-4775-b0df-8448c5ae430c&enlistedClasses=true`,
            {
            method: "GET",
                headers: {
                    "Authorization": this.state.auth
                }
            }
        )
            .then(response => response.json())
            .then(body => {
                this.setState({enlistments: body.enlistments[0].student_enlistment_classes});
            })
    }

    search_course = async (page) => {
        let key = this.state.keywords.replace(" ", "+");
        await fetch(
            `https://api-amis.uplb.edu.ph/api/students/classes?page=${page}&items=20&status=Active&course_code_like=${key}&section_like=${this.state.section}&class_status=Open`,
            {
            method: "GET",
                headers: {
                    "Authorization": this.state.auth
                }
            }
        )
            .then(response => response.json())
            .then(body => {
                this.setState({results: body.classes.data, 
                    totalpages: Math.ceil(body.classes.total/20),
                    page: body.classes.current_page
                });
            })
    }

    bookmark = async (class_id, parent_class_id, action) => {
        let data = {
            classes:
            [{
                class_id:class_id,
                class_details: {
                    lecture_details: {
                        class_id: class_id
                    },
                    child_details: {
                        class_id: "None"
                    }
                }
            }],
            action: action
        }

        if (parent_class_id) {
            if(action == "Bookmarked") {
                data.classes = [
                    {class_id:class_id, linked:parent_class_id},
                    {class_id:parent_class_id, linked:class_id}
                ]
            } else {
                data.classes = [{
                    class_id:class_id, linked:parent_class_id, 
                    class_details: {
                        course_id: 1,
                        lecture_details: {
                            class_id: parent_class_id
                        },
                        child_details: {
                            class_id: class_id
                        }
                    }
                }]
            }
        }

        await fetch(
            `https://api-amis.uplb.edu.ph/api/students/enlistments`,
            {
            method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": this.state.auth
                },
                body: JSON.stringify(data)
            }
        )
            .then(response => response.json())
            .then(body => {
                if(body.status) {
                    this.schedule();
                } else {
                    alert(body.message);
                }
            })
    }

    remove = async (course1) => {
        let course2 = course1.class.course;
        let link = course1.linked;
        let child = course1.class.id;

        if(!link) {
            link = course1.class.id;
            child = "None";
        }

        let data = {
            classes:[{
                course_id: course2.course_id,
                class_details: {
                    course_id: course2.course_id,
                    lecture_details: {
                        class_id: link
                    },
                    child_details: {
                        class_id: child
                    },
                }
            }],
            "action":"Deleted"
        }

        await fetch(
            `https://api-amis.uplb.edu.ph/api/students/enlistments/27333`,
            {
            method: "PUT",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": this.state.auth
                },
                body: JSON.stringify(data)
            }
        )
            .then(response => response.json())
            .then(body => {
                if(body.results) {
                    this.schedule();
                } else {
                    alert(body.message);
                }
            })
    }

    changePage = (page) => {
        if (page >= 1 && page <= this.state.totalpages) {
            this.search_course(page);
        }
    }

    handleChange(event) {
        this.setState({keywords: event.target.value});
    }

    handleSubmit(event) {
        this.search_course(this.state.page);
        event.preventDefault();
    }
    
    render() {
        if(!this.state.retrieve) {
            this.schedule();
            this.setState({retrieve: true});
        }

        return (
            <div style={{"textAlign": "center"}}>
                <div id="auth">
                <form onSubmit={(event) => {
                    this.schedule();
                    event.preventDefault();
                }}>
                    <label>Authorization Value Here</label>
                    <br/>
                    <textarea rows="2" cols="50" value={this.state.auth} onChange={(event) => {
                        this.setState({auth: event.target.value});
                    }}/>
                    <br/>
                    <input type="submit" />
                </form>
                </div>

                <div id="bookmark">
                    <h1>Your Class Schedule</h1>
                    <table style={{width:"100%"}}>
                        <tr>
                            <th>Course Code (Name)</th>
                            <th>Section (Course Id)</th> 
                            <th>Date & Time</th>
                            <th>Professor</th>
                            <th>Status</th>
                            <th>Enrollment<br/>Status
                            </th>
                        </tr>
                        {
                            this.state.enlistments.map((course1) => {
                                let class1 = course1.class;
                                let course2 = class1.course;
                                let prof = class1.faculties[0].faculty.user;

                                return <tr> 
                                    <td>{course2.course_code} ({course2.title})</td>
                                    <td>{class1.section} ({course1.class_id})</td>
                                    <td>{class1.date} {class1.start_time} - {class1.end_time}</td>
                                    {/* <td>-</td> */}
                                    <td>{prof.first_name} {prof.middle_name} {prof.last_name} ({prof.email})</td>
                                    <td>{
                                        class1.active_class_size/class1.max_class_size == 1?
                                        "Closed" : `${class1.active_class_size} / ${class1.max_class_size}`
                                    }</td>
                                    <td>{course1.status}
                                        <br/>
                                        <button onClick={() => this.remove(course1)}>Remove</button>
                                        <button>Enlist</button>
                                    </td>
                                </tr>
                            }
                        )}
                    </table>
                </div>
                <div id="search">
                    <h1>Search Courses</h1>
                    <form onSubmit={this.handleSubmit}>
                        <label>
                        Course Code
                        <br/>
                        <input required type="text" value={this.state.keywords} onChange={this.handleChange} />
                        </label>
                        <input type="submit" value="Submit" />
                    </form>
                    <br/>
                    <table style={{width:"100%"}}>
                        <tr>
                            <th>Course Code (Name)</th>
                            <th>Section (Course Id)</th> 
                            <th>Date & Time</th>
                            <th>Professor</th>
                            <th>Status</th>
                            <th>Bookmark</th>
                        </tr>
                        {
                            this.state.results.map((course1) => {
                                if(course1.faculties.length) {
                                    let prof = course1.faculties[0].faculty.user;
                                    return <tr> 
                                        <td>{course1.course_code} ({course1.course.title})</td>
                                        <td>{course1.section} ({course1.id})</td>
                                        <td>{course1.date} {course1.start_time} - {course1.end_time}</td>
                                        <td>{prof.first_name} {prof.middle_name} {prof.last_name} ({prof.email})</td>
                                        <td>{course1.active_class_size} / {course1.max_class_size}</td>
                                        <td><button onClick={() => this.bookmark(course1.id, course1.parent_class_id, "Bookmarked")}>Bookmark</button></td>
                                    </tr>
                                } else {
                                    return <tr> 
                                        <td>{course1.course_code} ({course1.course.title})</td>
                                        <td>{course1.section} ({course1.id})</td>
                                        <td>{course1.date} {course1.start_time} - {course1.end_time}</td>
                                        <td>TBA</td>
                                        <td>{course1.active_class_size} / {course1.max_class_size}</td>
                                        <td><button onClick={() => this.bookmark(course1.id, course1.parent_class_id, "Bookmarked")}>Bookmark</button></td>
                                    </tr>
                                }
                            }
                        )}
                    </table>
                    <br/>
                    <button onClick={() => this.changePage(this.state.page-1)}>Prev
                    </button> Page {this.state.page} of {this.state.totalpages} <button onClick={() => this.changePage(this.state.page+1)}>
                        Next</button>
                </div>
            </div>
        )
    }
}

export default Search;