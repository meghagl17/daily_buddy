"use client"

import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import TextField from '@mui/material/TextField'
import { 
  Checkbox, 
  FormControlLabel, 
  IconButton, 
  createTheme, 
  ThemeProvider, 
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box
} from '@mui/material'
import CallIcon from "@mui/icons-material/Call";

import { Settings, Add } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MoodComponent from '../components/mood';
// import { userInfo } from 'os'

export default function Dashboard() {
  const [value, setValue] = useState(dayjs())
  const [tasks, setTasks] = useState([])
  const [mood, setMood] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  
  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [newTaskDescription, setNewTaskDescription] = useState("")

  const handleCheckboxChange = async (id) => {
    try {
      // Find the task
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      // Toggle completed status in UI immediately for responsive feel
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
      
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("User ID not found");
        return;
      }
      
      // Call API to update task status
      const response = await fetch(`http://localhost:8000/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          completed: !task.completed
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
        // If update fails, revert the UI change
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === id ? { ...t, completed: task.completed } : t
          )
        );
      }
      
      // Successfully updated task in backend
      const updatedTask = await response.json();
      console.log('Task updated:', updatedTask);
      
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDateChange = (newValue) => {
    // Always navigate to day view regardless of whether date changed
    const formatted = newValue.format('YYYY-MM-DD');
    router.push(`/day?date=${formatted}`);
    // Update state after navigation to avoid any potential issues
    setValue(newValue);
  }
  
  const handleAddTaskClick = () => {
    setNewTaskDescription("");
    setTaskDialogOpen(true);
  };
  
  const handleTaskDialogClose = () => {
    setTaskDialogOpen(false);
  };
  
  const handleAddTask = async () => {
    if (!newTaskDescription.trim()) return;
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("User ID not found");
        return;
      }
      
      const currentDate = dayjs().format('YYYY-MM-DD');
      
      const response = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          date: currentDate,
          description: newTaskDescription,
          completed: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setTaskDialogOpen(false);
      
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const callUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("User ID not found");
        return;
      }
  
      // const response = await fetch("https://capable-stace-alb123-fd82ce46.koyeb.app/make_call", {
      //   method: "POST",
      //   // headers: {
      //   //   "Content-Type": "application/json",
      //   // },
      //   body: JSON.stringify({ user_id: userId }),
      // });

      fetch(`https://capable-stace-alb123-fd82ce46.koyeb.app/make_call?user_id=${userId}`, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Call response:", data);
        })
        .catch((error) => {
          console.error("Error making call:", error);
        });
  
      // if (!response.ok) {
      //   const errorData = await response.json(); // This might have more info on the 422
      //   console.error('Failed to initiate call:', errorData);
      //   return;
      // }
  
      // const data = await response.json();
      // console.log('Call initiated:', data);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };
  

  useEffect(() => {
    // Simple authentication check
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const currentDate = dayjs().format('YYYY-MM-DD');

        const tasksResponse = await fetch(`http://localhost:8000/api/tasks?userId=${userId}&date=${currentDate}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const moodResponse = await fetch(`http://localhost:8000/api/mood?userId=${userId}&date=${currentDate}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!tasksResponse.ok || !moodResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const tasksData = await tasksResponse.json();
        const moodData = await moodResponse.json();

        setTasks(tasksData);
        setMood(moodData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#F99A00' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const theme = createTheme({
    typography: {
      fontFamily: '"Loved by the King", cursive',
    },
    components: {
      MuiPickersDay: {
        styleOverrides: {
          root: {
            fontSize: '1.2rem',
            '&.Mui-selected': {
              backgroundColor: '#F99A00',
              color: 'white',
              '&:hover': {
                backgroundColor: '#ff9800',
              },
            },
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-6">
      <Typography variant="h5" className="londrina">
        Hello! Megha!
      </Typography>
        <IconButton onClick={() => router.push('/settings')}>
          <Settings fontSize="large" />
        </IconButton>
      </div>

      <div className="shadow-lg rounded-xl drop-shadow-[0_3px_2px_#F99A00]">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StaticDatePicker
            value={value}
            onChange={handleDateChange}
            renderInput={(params) => <TextField {...params} />}
            hideToolbar
            displayStaticWrapperAs="desktop"
            disableCloseOnSelect
            />
        </LocalizationProvider>
      </div>

      <Button 
        variant="contained" 
        color="primary"
        onClick={() => {
          const today = dayjs();
          const formatted = today.format('YYYY-MM-DD');
          router.push(`/day?date=${formatted}`);
        }}
        sx={{ mt: 2 }}
      >
        View Today
      </Button>

      <div className="mt-8 flex gap-6">
        <div className="w-1/2 bg-[#3BDBE3] rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Todays Tasks</h3>
              <IconButton onClick={handleAddTaskClick} size="small">
                <Add />
              </IconButton>
            </div>

            <div className="h-0.5 bg-white w-full mb-4"></div>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <FormControlLabel
                    key={task.id}
                    control={
                    <Checkbox
                        checked={task.completed}
                        onChange={() => handleCheckboxChange(task.id)}
                        sx={{
                          color: '#F99A00',
                          '&.Mui-checked': {
                            color: '#F99A00',
                          },
                        }}
                    />
                    }
                    label={task.description}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No tasks for today</div>
            )}
        </div>

        <div className="flex flex-col gap-4 w-1/2">
      {/* <div className="bg-white rounded-xl shadow-md p-4 text-center h-auto flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-">Mood</h3>

      </div> */}
      <MoodComponent mood={mood} />

      <div className="bg-white rounded-xl shadow-md p-1 text-center h-32 flex items-center justify-center">
        <div className="bg-[#F99A00] rounded-xl shadow-md p-2 text-center flex items-center justify-center loved">
          <span className="text-white">You got this! Good luck!</span>
        </div>
      </div>
    </div>
      </div>
      
      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={handleTaskDialogClose}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Description"
            type="text"
            fullWidth
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTaskDialogClose}>Cancel</Button>
          <Button onClick={handleAddTask} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </div>

    <Box
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1000,
      }}
    >
      <IconButton
    onClick={callUser}
    sx={{
      backgroundColor: "#3BDBE3",
      color: "#fff",
      boxShadow: 3,
    }}
  >
        <CallIcon />
      </IconButton>
    </Box>
    
    {/* <button onClick={callUser}>call</button> */}

    <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Londrina+Solid&display=swap');
  
    .londrina {
      font-family: 'Londrina Solid', cursive;
      color: #F99A00;
      font-size: 2.5rem;
    }
  `}</style>

  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Loved+by+the+King&display=swap');
  
    .loved {
      font-family: 'Loved by the King', cursive;
      color: #F99A00;
      font-size: 1.5rem;
    }
  `}</style>

    <style jsx>{`
        progress::-webkit-progress-bar {
          background-color: #e0e0e0;
          border-radius: 999px;
        }

        progress::-webkit-progress-value {
          background-color: #3BDBE3;
          border-radius: 999px;
        }
    `}</style>
    </ThemeProvider>
  )
}
