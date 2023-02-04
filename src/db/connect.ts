import Mongoose, { ConnectOptions } from 'mongoose'

const connectDB = (url: string) => {
	return Mongoose.connect(
		url,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		} as ConnectOptions
	)
};

export default connectDB;
