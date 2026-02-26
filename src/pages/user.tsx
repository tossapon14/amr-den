import UserImage from '../assets/images/user.png';
import NetworkError from './networkError';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosDelete, axiosGet } from "../api/axiosFetch";
import './css/user_style.css';
import { BsThreeDotsVertical } from "react-icons/bs";
import ResponseAPI from './option/responseAPI';
import { useTranslation } from 'react-i18next';
import NotAuthenticated from './option/notAuthenticated';
import { HiOutlineUser } from "react-icons/hi2";
import { TbUserShare } from "react-icons/tb";
import { MdPassword } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";


interface IUser {
  message: string
  payload: IuserPayload[]
  structure: IStructure
}
interface IStructure {
  total_items: number
  total_pages: number
  page: number
  page_size: number
}

interface IuserPayload {
  name: string
  username: string
  password: string
  employee_no: string
  role: string
  access_token?: string
  status: boolean
  bg?: string
}
export default function User() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page: number = Number(searchParams.get("page") || 1);
  const page_size = searchParams.get('page_size') || '10';

  const [checkNetwork, setCheckNetwork] = useState(true);
  const [pagination, setPagination] = useState<React.ReactElement | null>(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [UserList, setUserList] = useState<IuserPayload[]>([]);
  const [showOption, setShowOption] = useState<{ show: boolean, top?: string, left?: string, indexRow?: number }>({ show: false, });
  const [showConfirmDelete, setShowconfirmDelete] = useState<{ show: boolean, username?: string }>({ show: false, username: '' });
  const saveUserIndex = useRef<number | null>(null); // Initialize with null
  const [responseData, setResponseData] = useState<{ error: boolean | null, message?: string }>({ error: null });
  const userRef = useRef<IuserPayload[]>([]);
  const searchName = useRef<HTMLInputElement>(null);
  const checkAdmin = useRef<HTMLInputElement>(null);
  const checkOperator = useRef<HTMLInputElement>(null);
  const checkViewer = useRef<HTMLInputElement>(null);
  const [notauthenticated, setNotAuthenticated] = useState(false);
  const Debounce = useRef<ReturnType<typeof setTimeout> | null>(null); // Use NodeJS.Timeout for TypeScript
  const { t } = useTranslation("user");

  const searchUser = () => {

    if (Debounce.current)  // Clear the previous timeout if it exists          
      clearTimeout(Debounce.current);
    Debounce.current = setTimeout(() => {
      const data = {
        text: searchName.current?.value.trim().toLowerCase(),
        admin: checkAdmin.current?.checked,
        operator: checkOperator.current?.checked,
        viewer: checkViewer.current?.checked
      };

      const userSearch = userRef.current.filter((u: IuserPayload) => {
        // Check position filter
        const matchAdmin = data.admin && u.role === 'admin';
        const matchOperator = data.operator && u.role === 'operator';
        const matchViewer = data.viewer && u.role === 'viewer';
        const matchPosition = data.admin || data.operator || data.viewer ? (matchAdmin || matchOperator || matchViewer) : true;

        // Check name filter
        const matchName = data.text ? u.name.toLowerCase().includes(data.text) : true;

        return matchPosition && matchName;
      });

      setUserList(userSearch);
    }, 500); // Debounce delay

  };
  const btnForOption = (index: number) => {
    setShowOption({ show: false });
    if (index === 0) { // edit user
      if (saveUserIndex.current !== null) {
        const user = UserList[saveUserIndex.current!];
        console.log(user);
        // navigate(`/edit-user?employee_no=${user.employee_no}&username=${user.username}&name=${user.name}&role=${user.role}`);
      } // Check if the index is valid

    } else if (index === 1) { // edit password
      const user = UserList[saveUserIndex.current!];
      navigate(`/change-password?employee_no=${user.employee_no}&username=${user.username}&name=${user.name}&role=${user.role}`);

    } else if (index === 2) { //
      if (saveUserIndex.current === null) return; // Check if the index is valid
      setShowconfirmDelete({ show: true, username: UserList[saveUserIndex.current!].username });
    }
  }

  const handleCloseModalDelete = () => {
    setShowconfirmDelete({ show: false });
    saveUserIndex.current = null; // Reset the index when closing the option
  };

  const openOption = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    saveUserIndex.current = index; // Save the index of the clicked user
    setShowOption({ show: true, left: `${rect.left - 120}px`, top: `${rect.top}px`, indexRow: index });
  }

  const handleOpenInNewTab = () => {
    navigate('/create-User');
  };
  const reloadPage = async (data: { p?: number, ps?: string }) => {
    try {
      var params = '';
      if (data.p) {
        params = `?username=ALL&page=${data.p?.toString()}&page_size=${page_size}`
      } else if (data.ps) {
        params = `?username=ALL&page=1&page_size=${data.ps}`
      }
      navigate(params);
      window.location.reload(); // Force reload if needed
    } catch (e: any) {
      console.error(e);
    }
  }

  const onConfirmDelete = async () => {
    try {
      if (saveUserIndex.current === null) return; // Check if the index is valid
      const user = UserList[saveUserIndex.current!];
      const data = {
        employee_no: user.employee_no,
        name: user.name,
        role: user.role,
        username: user.username,
      }

      saveUserIndex.current = null; // Reset the index when closing the option
      setResponseData({ error: null, message: "loading" });
      const delres: IUser = await axiosDelete(
        '/user/delete_user?page=1&page_size=10', data
      );
      if (delres.message ===
        "Payload of all available users.") {
        setShowconfirmDelete({ show: false });
        setResponseData({ error: false, message: "delete user success" })
        setTimeout(() => {
          window.location.reload(); // Force reload if needed
        }, 3100);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.detail) {
        setResponseData({ error: true, message: e.response.data.detail })
      } else {
        setResponseData({ error: true, message: e?.message })
      }

    }
  }



  useEffect(() => {
    if (sessionStorage.getItem('user')!.split(",")[2] !== "admin") {
      window.location.href = "/login";
    }
    const _pagination = (ttp: number): React.ReactElement | null => {

      if (ttp <= 5) {
        return (<div className='pagination'>

          {[...Array(ttp)].map((_, index) => {
            const pageNumber = index + 1;
            return (
              <a
                key={pageNumber}
                onClick={() => reloadPage({ p: pageNumber })}
                className={pageNumber === page ? "active" : ""}
              >
                {pageNumber}
              </a>
            );
          })}

        </div>);
      }
      else if (ttp > 5) {
        let intial: number;
        if (ttp - page < 5) {// last page
          intial = ttp - 4
        } else if (page > 2) {
          intial = page - 2
        } else if (page > 1) {
          intial = page - 1
        } else {
          intial = page
        }
        return (<div className="pagination">

          <a
            onClick={() => reloadPage({ p: page > 1 ? page - 1 : 1 })}
            className={page === 1 ? "disabled" : ""}
          >
            &laquo;
          </a>

          {/* Page Numbers */}
          {

            [...Array(5)].map((_, index) => {
              const pageNumber = intial + index;
              return (
                <a
                  key={pageNumber}
                  onClick={() => reloadPage({ p: pageNumber })}
                  className={pageNumber === page ? "active" : ""}
                >
                  {pageNumber}
                </a>
              );
            })}

          {/* Next Button */}
          <a
            onClick={() => reloadPage({ p: page + 1 })}
            className={page === ttp ? "disabled" : ""}
          >
            &raquo;
          </a>
        </div>);
      }
      else return null
    };

    const getUser = async () => {
      try {
        const res: IUser = await axiosGet(
          `/user/users?username=ALL&page=${page}&page_size=${page_size}`
        );
        const userList: IuserPayload[] = [];
        console.log(res);
        res.payload.forEach((user) => {
          ;
          userList.push(user);
        });
        setPagination(_pagination(res.structure?.total_pages));
        setUserList(userList);
        userRef.current = userList;
      } catch (e: any) {
        console.error(e?.message);
        if (e.response?.status === 401 || e.response?.data?.detail === "Invalid token or Token has expired.") {
          setNotAuthenticated(true)
        }
      }
    }

    const checkNetwork = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_API_URL, { method: "GET" });
        if (response.ok) {
          getUser();
        }
      } catch (e: any) {
        console.error(e);
        setCheckNetwork(false);
      } finally {
        if (!loadSuccess) {
          setLoadSuccess(true);
        }
      }
    };
    checkNetwork();


  }, []);
  return (
    <div className='user-box-page'>
      {!loadSuccess && <div className='loading-background'>
        <div id="loading"></div>
      </div>}
      {notauthenticated && <NotAuthenticated />}
      <div className='mission-title-box'>
        <h1>{t("us_title")}</h1>
        <div className="title1">
          <div className='d-flex align-items-center justify-content-center rounded-circle bg-danger text-white' style={{ width: "32px", height: "32px" }}>
            <HiOutlineUser size={24} />
          </div>
          <span>{t("us_subtitle")}</span>
        </div>
      </div>
      {!checkNetwork ? <NetworkError /> :

        <div className='px-2 px-lg-4 mt-3 user-card-box'>
          <ResponseAPI response={responseData} />
          <div className={`fixed-bg-delete ${showConfirmDelete.show ? "" : "d-none"}`}>
            <div className='box-confirm-delete'>
              <div className="d-flex align-items-center">
                <RiDeleteBin6Line size={40} className="me-2" />
                <h5 className='ms-2'>{t("delete_user")}</h5>
              </div>
              <p className='text-center'>  <span className='name-user'>{showConfirmDelete.username}</span></p>
              <div className='box-confirm-delete-btn'>
                <button className='btn btn-outline-danger' onClick={handleCloseModalDelete}>{t("close")}</button>
                <button className='btn btn-outline-primary' onClick={() => onConfirmDelete()}>{t("save")}</button>
              </div>
            </div>
          </div>
          {showOption.show && <div className='display-option-bg' onClick={() => setShowOption({ show: false })}>
            <div className='display-option' style={{ left: showOption.left, top: showOption.top }}>
              <div className='btn-mode-option' onClick={() => btnForOption(0)}>
                <TbUserShare/>
                <p>{t("edit_us")}</p>
              </div>
              <div className='btn-mode-option' onClick={() => btnForOption(1)}>
                <MdPassword/>
                <p>{t("edit_pass")}</p>
              </div>
              <div className='btn-mode-option' onClick={() => { btnForOption(2) }}>
                <RiDeleteBin6Line/>

                <p>{t("del")}</p>
              </div>
            </div>

          </div>}
          <div className='user-card d-flex mb-5'>
            <div className='box-of-search position-relative'>
              <h5>{t("search")}</h5>
              <div className="create-reload-mobile-button">
                <button className='btn btn-outline-danger mt-2' onClick={handleOpenInNewTab}>{t("create")}</button>
                <button className='btn btn-outline-dark mt-2 ms-2' onClick={() => window.location.reload()}>{t("reload")}</button>
              </div>
              <div className="search-content">
                <div className='box-of-search-content-item me-2 me-lg-0'>
                  <label htmlFor="username">{t("name")}</label><br></br>
                  <input ref={searchName} type="text" className="input-search" placeholder={t("inp_name")} onChange={() => searchUser()} />
                </div>

                <h6 className=' me-3 d-none d-sm-block'>{t("other")}</h6>
                <div className='d-flex align-items-center mb-1 me-3'>
                  <input ref={checkAdmin} type="checkbox" id="admin" onChange={() => searchUser()} />
                  <label htmlFor="admin">{t("admin")}</label>
                </div>
                <div className='d-flex align-items-center mb-1'>
                  <input ref={checkOperator} type="checkbox" id="operator" onChange={() => searchUser()} />
                  <label htmlFor="operator">{t("operator")}</label>
                </div>
                 <div className='d-flex align-items-center mb-1'>
                  <input ref={checkViewer} type="checkbox" id="viewer" onChange={() => searchUser()} />
                  <label htmlFor="viewer">{t("viewer")}</label>
                </div>
              </div>

            </div>
            <div className='flex-grow-1 overflow-hidden column-user-table'>
              <div className="create-reload-button">
                <button className='btn btn-outline-danger mt-2' onClick={handleOpenInNewTab}>{t("create")}</button>
                <button className='btn btn-outline-dark mt-2 ms-2' onClick={() => window.location.reload()}>{t("reload")}</button>
              </div>

              <div className='table-user overflow-auto'>
                <table className="table table-hover mt-2 " style={{ minWidth: "665px" }}>
                  <thead className='bg-light'>
                    <tr>
                      <th scope="col">{t("tb_id")}</th>
                      <th scope="col">{t("name")}</th>
                      <th scope="col">{t("tb_user")}</th>
                      <th scope="col">{t("tb_empl")}</th>
                      <th scope="col">{t("tb_role")}</th>
                      <th scope="col">{t("tb_status")}</th>
                      <th scope="col" ></th>

                    </tr>
                  </thead>
                  <tbody  >
                    {UserList.map((user, index) => <tr key={index}>
                      <td scope="row">#{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center" >
                          <div className="rounded-circle d-flex  align-items-center justify-content-center me-2" style={{ fontWeight: 'bold', width: "32px", height: "32px", backgroundColor: "red", color: 'white' }}>{user.name[0].toUpperCase()}</div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td>{user.employee_no}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.status ? <div className='boxonline'>
                          {t('online')}
                        </div> : <div className='boxonline' style={{ backgroundColor: "rgb(250, 216, 216)", color: "rgb(255, 0, 0)" }}>
                          {t('offline')}
                        </div>}
                      </td>
                      <td>
                        <button className="btn-bg-none" onClick={(e) => openOption(e, index)}><BsThreeDotsVertical /></button>
                      </td>
                    </tr>)}

                  </tbody>
                </table>



              </div>
              <div className='page-number-d-flex'>

                <div className="tooltip-container">
                  <button type="button" onClick={() => { }}>{page_size}</button>
                  <div className="box-tooltip">
                    <button className='btn-page-size' onClick={() => reloadPage({ ps: '10' })}>10</button>
                    <button className='btn-page-size' onClick={() => reloadPage({ ps: '50' })}>50</button>
                    <button className='btn-page-size' onClick={() => reloadPage({ ps: '100' })}>100</button>
                  </div>
                </div>
                <span className='ms-1 me-3'>{t("user/page")}</span>
                {pagination}
              </div>
            </div>

          </div>
        </div>
      }
    </div>
  );
}